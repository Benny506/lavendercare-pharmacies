import axios from "axios"
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabaseClient"

export const requestApi = async ({ url, method, data, token }) => {
    const headers =
    {
        "Accept": "application/json",
        "Content-Type": "application/json; charset=utf-8"
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`

    } else {
        headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`
    }

    const config = {
        url: `${url}`,
        method,
        headers
    }

    if (data) {
        config.data = data
    }

    console.log(config.url)

    return axios(config)
        .then(response => {
            return { result: response.data, responseStatus: true }
        })
        .catch((error) => {
            console.log(error)
            if (error.response) {
                //Request made and server responded
                return { responseStatus: false, errorMsg: error.response.data, statusCode: error.status }
            }


            else if (error.request) {
                //Request made but no server response
                return { responseStatus: false, errorMsg: { error: 'You have to be online for this to work' }, statusCode: error.status }
            }


            else {
                return { responseStatus: false, errorMsg: { error: 'Unexpected error' }, statusCode: error.status }
            }
        })

}


export const onRequestApi = async ({ requestInfo, successCallBack, failureCallback }) => {
    try {

        if (!successCallBack || !failureCallback || !requestInfo) {
            return;
        }

        const request = await requestApi(requestInfo)

        const { result, responseStatus, errorMsg, statusCode } = request

        if (responseStatus) {
            return successCallBack({ requestInfo, result })

        } else {
            console.log(errorMsg)
            const _errorMsg = errorMsg?.details?.message || "Unexpected server error"
            return failureCallback({ requestInfo, errorMsg: _errorMsg, statusCode })
        }

    } catch (error) {
        console.log(error)
        return failureCallback({ requestInfo, errorMsg: 'Server error!' })
    }
}

export const cloudinaryUpload = async ({ files }) => {
    try {
        const url = 'https://api.cloudinary.com/v1_1/dqcmfizfd/auto/upload'

        // Map each file to a fetch-promise
        const uploadPromises = files.map(file => {
            if (!file) return Promise.resolve(null)

            const formData = new FormData()
            formData.append('file', file)
            formData.append('upload_preset', 'testing')
            formData.append('folder', 'testing')

            return fetch(url, {
                method: 'POST',
                body: formData
            })
                .then(async response => {

                    const data = await response.json()

                    if (!response.ok) {
                        console.log(data)
                        throw new Error(data?.error?.message || `Upload failed with status ${response.status}`)
                    }
                    return data
                })
        })

        // Await all uploads in parallel
        const uploadedFiles = (await Promise.all(uploadPromises))
            .filter(Boolean) // drop any nulls if files array had holes

        return {
            responseStatus: true,
            result: uploadedFiles,
            errorMsg: null
        }
    } catch (error) {
        console.error('Cloudinary upload error:', error)
        return {
            responseStatus: false,
            result: null,
            errorMsg: {
                error: 'An unexpected error occurred, try again later',
                actualError: error
            }
        }
    }
}

export const getPublicUrl = async ({ filePath, bucket_name }) => {

    try {
        const { data, error } = await supabase
            .storage
            .from(bucket_name)
            .getPublicUrl(filePath)

        if (error) {
            console.log(data, error)
            throw new Error()
        }

        // return data.signedUrl
        return {
            publicUrl: data.publicUrl,
            error: null
        }

    } catch (error) {
        console.log("GET URL ERROR!", error)
        return {
            publicUrl: null,
            error: 'Cant seem to load this at the time. Try again later'
        }
    }
}

export async function getSignedUploadUrl({ id, bucket_name, ext }) {
    try {
        const { result, errorMsg } = await requestApi({
            url: "https://tzsbbbxpdlupybfrgdbs.supabase.co/functions/v1/create-upload-url",
            method: "POST",
            data: {
                id,
                bucket_name,
                ext
            },
        });

        if (errorMsg) {
            console.log(errorMsg);
            throw new Error(errorMsg);
        }

        return result;

    } catch (error) {
        console.log(error);
        return { signedUrl: null };
    }
}

export async function uploadAsset({ file, id, bucket_name, ext }) {
    try {
        // ✅ If multiple files are provided, upload all in parallel
        if (Array.isArray(file)) {
            const results = await Promise.all(
                file.map(async (f, i) => {
                    const { signedUrl, filePath } = await getSignedUploadUrl({
                        id: `${id}`, // make path unique
                        bucket_name,
                        ext: f.name?.split('.').pop() || ext,
                    });

                    if (!signedUrl || !filePath)
                        throw new Error("Error getting signed upload URL");

                    const uploadRes = await fetch(signedUrl, {
                        method: "PUT",
                        headers: {
                            "Content-Type": f.type || "application/octet-stream",
                        },
                        body: f,
                    });

                    if (!uploadRes.ok) throw new Error(`Upload failed for file ${f.name || i}`);

                    return filePath;
                })
            );

            return {
                filePaths: results,
                error: null,
            };
        }

        // ✅ Otherwise, handle single upload as before
        const { signedUrl, filePath } = await getSignedUploadUrl({ id, bucket_name, ext });

        if (!signedUrl || !filePath) throw new Error("Error getting signed upload url");

        const uploadRes = await fetch(signedUrl, {
            method: "PUT",
            headers: {
                "Content-Type": file.type || "application/octet-stream",
            },
            body: file,
        });

        if (!uploadRes.ok) {
            console.log(uploadRes)
            throw new Error("Upload failed");
        }

        return {
            filePath,
            error: null,
        };
    } catch (error) {
        console.error(error);
        return {
            filePath: null,
            error: "Error uploading asset",
        };
    }
}

export const getPublicImageUrl = ({ path, bucket_name }) =>
    path?.startsWith("https")
        ?
        path
        :
        !path
            ?
            ''
            :
            `https://tzsbbbxpdlupybfrgdbs.supabase.co/storage/v1/object/public/${bucket_name}/${path}`;