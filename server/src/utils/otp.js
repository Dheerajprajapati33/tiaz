const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendSMS = async (mobile, otp) => {
  try {
    const smsUrl = `https://sattareddyanna.com/APIs/Home.asmx/SendSMS?Phone=${mobile}&otp=${otp}`;
    const smsResponse = await fetch(smsUrl);

    if (!smsResponse.ok) {
      console.error(`SMS Gateway returned status ${smsResponse.status}`);
    } else {
      const responseText = (await smsResponse.text()).trim();
      console.log(`SMS Gateway response for ${mobile}:`, responseText);
    }
  } catch (smsError) {
    console.error("SMS API Network Error (OTP printed below):", smsError.message);
  }
};

module.exports = {
  generateOTP,
  sendSMS
};
