import { requestApi } from "./requestApi"

const adminMail = 'olomufeh@gmail.com'

export const statusUpdateMail = async ({
    toAdmin,
    to_email,
    receiver_id,
    subject,
    btn_link,
    extra_text,
    title,
    username
}) => {

    let receiver_email = toAdmin ? adminMail : to_email

    if (!receiver_email && receiver_id) {
        const { data, error } = await supabase.rpc("get_user_email", {
            // p_user_id: receiver_id,
            p_user_id: '9c291b48-308d-4c2b-9bf6-1570b60e8dfd', //test: Id belongs to olomufeh@gmail.com
        })

        if (error) {
            console.log(error)
        }

        receiver_email = data
    }

    if (!receiver_email) return;

    await sendEmail({
        // to_email: selectedProvider?.email,
        to_email: receiver_email,
        subject,
        data: {
            title,
            extra_text,
            btn_link,
            username
        },
        template_id: '3yxj6ljqjv7gdo2r'
    })
}

export async function sendEmail({
    from_email = 'no-reply@lavendercare.co',
    toAdmin = false,
    subject,
    to_email,
    data,
    template_id
}) {

    try {
        if (!template_id) throw new Error("Invalid email template!");

        const { result, errorMsg } = await requestApi({
            url: 'https://tzsbbbxpdlupybfrgdbs.supabase.co/functions/v1/send-email-via-mailsender',
            method: 'POST',
            data: {
                from_email,
                to_email: toAdmin ? adminMail : to_email,
                data,
                template_id,
                subject
            }
        })

        if (errorMsg) {
            console.log("Mail Sending error", errorMsg)
            return { sent: false, errorMsg }
        }

        console.log(result)

        return { sent: true, errorMsg: null }

    } catch (error) {
        console.log("Mail Sending error", error)
        return { sent: false, errorMsg: error?.message || 'Something went wrong! Try again.' }
    }
}