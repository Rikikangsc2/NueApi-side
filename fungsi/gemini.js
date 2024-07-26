const axios = require('axios');
const succes = "https://nue-api.vercel.app/succes?re=";
const base = "https://nue-api.vercel.app";
const failed = "https://nue-api.vercel.app/error"
let chatHistory = [];

const handleChat = async (req, res, systemMessage) => {
    const userId = req.query.user;
    const prompt = req.query.text;
    systemMessage = systemMessage || req.query.systemPrompt;

    const sendRequest = async (sliceLength) => {
        try {
            const messages = chatHistory.slice(-sliceLength);
            const payload = {
                messages: [
                    { role: "system", content: systemMessage },
                    ...messages.map(msg => ({ role: msg.role, content: msg.content })),
                    { role: "user", content: prompt }
                ]
            };

            const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyB2tVdHido-pSjSNGrCrLeEgGGW3y28yWg', {
                contents: [{
                    parts: [{
                        text: JSON.stringify(payload) + '\nNote: Answer new questions directly'
                    }]
                }]
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const assistantMessage = { role: "assistant", content: response.data.candidates[0].content.parts[0].text.trim() };
            chatHistory.push({ role: "user", content: prompt }, assistantMessage);

            if (chatHistory.length > 100) {
                chatHistory = chatHistory.slice(-100);
            }

            assistantMessage.content = assistantMessage.content.replace(/\n\n/g, '\n    ');
            assistantMessage.content = assistantMessage.content.replace(/\*\*/g, '*');

            await axios.post(`https://copper-ambiguous-velvet.glitch.me/write/${userId}`, {
                json: { [userId]: chatHistory }
            });

            const json = { result: assistantMessage.content, history: `https://copper-ambiguous-velvet.glitch.me/read/${userId}` }
            const red = encodeURIComponent(JSON.stringify(json));
            res.redirect(succes + red);
            return true;
        } catch (error) {
            return false;
        }
    };

    try {
        let readResponse = { data: {} };
        try {
            readResponse = await axios.get(`https://copper-ambiguous-velvet.glitch.me/read/${userId}`);
        } catch (error) {
            await axios.post(`https://copper-ambiguous-velvet.glitch.me/write/${userId}`, { json: { [userId]: [] } });
            readResponse.data = {};
        }
        chatHistory = readResponse.data[userId] || [];

        let success = false;
        for (let sliceLength = 100; sliceLength >= 0; sliceLength -= 10) {
            success = await sendRequest(sliceLength);
            if (success) break;
        }
        if (!success) throw new Error('All retries failed');
    } catch (error) {
        await axios.post(`https://copper-ambiguous-velvet.glitch.me/write/${userId}`, {
            json: { [userId]: [] }
        });
        console.error('Error request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { handleChat };