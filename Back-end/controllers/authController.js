exports.login = (req, res, next) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        const adminEmail    = (process.env.ADMIN_EMAIL    || '').toLowerCase();
        const adminPassword =  process.env.ADMIN_PASSWORD || '';
        if (email.trim().toLowerCase() === adminEmail && password === adminPassword) {
            return res.json({ success: true, role: 'admin', email: adminEmail });
        }
        return res.status(401).json({ error: 'Incorrect email or password.' });
    } catch (err) {
        next(err);
    }
};

exports.recommend = async (req, res, next) => {
    const { message, books } = req.body || {};
    if (!message) {
        return res.status(400).json({ error: 'message is required.' });
    }

    let systemPrompt =
        'You are a book recommendation assistant for Maktaba, an online bookstore. ' +
        'When the user describes what they want — a theme, mood, feeling, or topic — ' +
        'find the books from our catalogue that best match that description and recommend 3 to 5 of them. ' +
        'Use your knowledge of each book\'s themes, tone, and story to judge the fit, not just the genre label. ' +
        'For each recommendation give the title in quotes, the author, and one sentence explaining why it matches. ' +
        'Write in plain, warm prose. No bullet points, no markdown headers, no numbered lists.';

    if (Array.isArray(books) && books.length > 0) {
        const list = books.map(b => `"${b.title}" by ${b.author} (${b.genre})`).join(', ');
        systemPrompt += ` Our full catalogue (only recommend from this list): ${list}.`;
    }

    try {
        const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': req.headers.referer || req.headers.origin || 'http://localhost:3000',
                'X-Title': 'Maktaba',
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
                stream: true,
                max_tokens: 600,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user',   content: message },
                ],
            }),
        });

        if (!upstream.ok) {
            const errText = await upstream.text();
            return res.status(upstream.status).json({ error: errText });
        }

        res.setHeader('Content-Type',  'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection',    'keep-alive');

        const reader = upstream.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
        }
        res.end();
    } catch (err) {
        /* SSE stream may have started — only forward to error handler if headers are still clean */
        if (!res.headersSent) next(err);
    }
};
