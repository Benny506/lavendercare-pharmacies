import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useUi } from '../../context/uiContextBase';
import { createOrUpdateOtp, validateOtp } from '../../lib/supabaseClient';
import { sendEmail } from '../../lib/email';

const OtpPage = ({ onVerify, email, fromForgotPassword }) => {
    const navigate = useNavigate();
    const { showAlert, startLoading, stopLoading } = useUi();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(0);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        if (email) {
            handleSendOtp();
        }
    }, [email]);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleSendOtp = async () => {
        startLoading();
        try {
            const req = await createOrUpdateOtp({ email, requiresAuth: fromForgotPassword ? true : false });
            const { token, error, userAlreadyExists } = req

            console.log(req)

            if (error) {
                throw new Error(error);
            }

            if (userAlreadyExists) {
                // Handle case where user exists if needed, but for now we proceed or alert
                // For registration, usually we might want to warn.
                // But let's assume we just send the OTP for verification.
            }

            if (token && token.otp) {
                const { sent, errorMsg } = await sendEmail({
                    subject: 'Email verification',
                    to_email: email,
                    data: {
                        code: token.otp
                    },
                    template_id: '3vz9dle7wpn4kj50'
                });

                if (!sent) {
                    throw new Error(errorMsg || 'Failed to send email');
                }

                showAlert('success', 'OTP sent to your email!');
                setTimer(60); // 60 seconds cooldown
                setCanResend(false);

            } else {
                throw new Error('Failed to generate OTP');
            }

        } catch (error) {
            console.error(error);
            showAlert('error', error.message || 'Failed to send OTP. Please try again.');
        } finally {
            stopLoading();
        }
    };

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;

        const newOtp = [...otp.map((d, idx) => (idx === index ? element.value : d))];
        setOtp(newOtp);

        // Focus next input
        if (element.value && element.nextSibling) {
            element.nextSibling.focus();
        }

        // Auto submit if all filled? User didn't ask, but good UX. 
        // But let's stick to button click as per existing code structure.
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && e.target.previousSibling) {
            e.target.previousSibling.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpValue = otp.join('');
        if (otpValue.length !== 6) {
            showAlert('error', 'Please enter a valid 6-digit OTP');
            return;
        }

        startLoading();
        try {
            const isValid = await validateOtp({ email, otp: otpValue });

            if (isValid) {
                showAlert('success', 'OTP verified successfully!');
                if (onVerify) await onVerify(otpValue);
            } else {
                throw new Error('Invalid OTP');
            }
        } catch (error) {
            console.error(error);
            showAlert('error', 'Invalid OTP. Please try again.');
        } finally {
            stopLoading();
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'radial-gradient(circle at top left, #ede9fe, #f5f5f9)', minWidth: '100vw' }}>
            <Card className="shadow-lg border-0" style={{ width: '100%', maxWidth: '400px', borderRadius: '16px' }}>
                <Card.Body className="p-4">
                    <div className="text-center mb-4">
                        <h4 className="fw-bold text-primary">Verify OTP</h4>
                        <p className="text-muted small">Enter the 6-digit code sent to {email}</p>
                    </div>

                    <Form onSubmit={handleSubmit}>
                        <div className="d-flex justify-content-center gap-2 mb-4">
                            {otp.map((data, index) => {
                                return (
                                    <input
                                        className="form-control text-center fw-bold fs-4"
                                        type="text"
                                        name="otp"
                                        maxLength="1"
                                        key={index}
                                        value={data}
                                        onChange={(e) => handleChange(e.target, index)}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                        onFocus={(e) => e.target.select()}
                                        style={{ width: '48px', height: '56px', borderRadius: '8px' }}
                                    />
                                );
                            })}
                        </div>

                        <Button variant="primary" type="submit" className="w-100 py-2 fw-bold shadow-sm" style={{ background: '#7b3fe4', border: 'none' }}>
                            Verify Code
                        </Button>
                    </Form>

                    <div className="text-center mt-4">
                        <p className="small text-muted mb-0">
                            Didn't receive code?
                            {canResend ? (
                                <Button variant="link" onClick={handleSendOtp} className="p-0 small fw-bold text-primary text-decoration-none ms-1">Resend</Button>
                            ) : (
                                <span className="ms-1 text-muted">Resend in {timer}s</span>
                            )}
                        </p>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default OtpPage;
