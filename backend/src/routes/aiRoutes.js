const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurazione multer per upload immagini
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo file immagine sono consentiti'), false);
        }
    }
});

// URLs dei servizi AI
const AI_SERVICES = {
    TTS: process.env.TTS_URL || 'http://coqui-tts:5002',
    MEDIAPIPE: process.env.MEDIAPIPE_URL || 'http://mediapipe-service:5003',
    STABLE_DIFFUSION: process.env.SD_URL || 'http://stable-diffusion:7860',
    OLLAMA: process.env.OLLAMA_URL || 'http://ollama:11434'
};

// === QUICK TEST ENDPOINTS ===
router.get('/quick-test', async (req, res) => {
    try {
        const startTime = Date.now();
        
        // Test solo i servizi più veloci
        const quickTests = await Promise.allSettled([
            axios.get(`${AI_SERVICES.MEDIAPIPE}/health`, { timeout: 1000 }),
            axios.get(`${AI_SERVICES.TTS}/health`, { timeout: 1000 })
        ]);
        
        const endTime = Date.now();
        
        res.json({
            success: true,
            response_time: `${endTime - startTime}ms`,
            mediapipe: quickTests[0].status === 'fulfilled' ? 'OK' : 'ERROR',
            tts: quickTests[1].status === 'fulfilled' ? 'OK' : 'ERROR',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// === ENDPOINT FAST GENERATE ===
router.post('/fast-generate', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ 
                success: false, 
                error: 'Prompt richiesto' 
            });
        }
        
        // Generazione super veloce con parametri minimi
        const response = await axios.post(`${AI_SERVICES.STABLE_DIFFUSION}/generate`, {
            prompt,
            width: 128,
            height: 128,
            steps: 5,
            guidance_scale: 5.0
        }, { timeout: 30000 });
        
        res.json({
            success: true,
            service: 'Fast Stable Diffusion',
            mode: 'speed_optimized',
            ...response.data
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: `Errore generazione veloce: ${error.message}` 
        });
    }
});

// === HEALTH CHECK GENERALE (OTTIMIZZATO) ===
router.get('/health', async (req, res) => {
    const services = {};
    
    // Controlli paralleli per velocità
    const healthChecks = Object.entries(AI_SERVICES).map(async ([name, url]) => {
        try {
            const response = await axios.get(`${url}/health`, { 
                timeout: 1500, // Ridotto timeout
                headers: { 'Connection': 'close' } // Evita keep-alive 
            });
            services[name] = { 
                status: 'healthy', 
                url: url,
                response_time: response.headers['x-response-time'] || 'N/A'
            };
        } catch (error) {
            services[name] = { 
                status: 'unhealthy', 
                url: url,
                error: error.code || error.message 
            };
        }
    });
    
    await Promise.allSettled(healthChecks);
    
    res.json({
        ai_backend: 'operational',
        timestamp: new Date().toISOString(),
        services
    });
});

// === MEDIAPIPE ENDPOINTS ===

router.post('/detect-faces', upload.single('image'), async (req, res) => {
    try {
        if (!req.file && !req.body.image) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nessuna immagine fornita. Carica un file o invia dati base64.' 
            });
        }
        
        let imageData;
        if (req.file) {
            const imagePath = path.resolve(req.file.path);
            const imageBuffer = fs.readFileSync(imagePath);
            imageData = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
            fs.unlinkSync(imagePath); // Pulisci file temporaneo
        } else {
            imageData = req.body.image;
        }
        
        const response = await axios.post(`${AI_SERVICES.MEDIAPIPE}/detect_faces`, {
            image: imageData
        }, { timeout: 10000 });
        
        res.json({
            success: true,
            service: 'MediaPipe Face Detection',
            ...response.data
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: `Errore rilevamento volti: ${error.message}` 
        });
    }
});

router.post('/detect-hands', upload.single('image'), async (req, res) => {
    try {
        if (!req.file && !req.body.image) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nessuna immagine fornita' 
            });
        }
        
        let imageData;
        if (req.file) {
            const imagePath = path.resolve(req.file.path);
            const imageBuffer = fs.readFileSync(imagePath);
            imageData = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
            fs.unlinkSync(imagePath);
        } else {
            imageData = req.body.image;
        }
        
        const response = await axios.post(`${AI_SERVICES.MEDIAPIPE}/detect_hands`, {
            image: imageData
        }, { timeout: 10000 });
        
        res.json({
            success: true,
            service: 'MediaPipe Hand Detection',
            ...response.data
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: `Errore rilevamento mani: ${error.message}` 
        });
    }
});

router.post('/detect-pose', upload.single('image'), async (req, res) => {
    try {
        if (!req.file && !req.body.image) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nessuna immagine fornita' 
            });
        }
        
        let imageData;
        if (req.file) {
            const imagePath = path.resolve(req.file.path);
            const imageBuffer = fs.readFileSync(imagePath);
            imageData = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
            fs.unlinkSync(imagePath);
        } else {
            imageData = req.body.image;
        }
        
        const response = await axios.post(`${AI_SERVICES.MEDIAPIPE}/detect_pose`, {
            image: imageData
        }, { timeout: 10000 });
        
        res.json({
            success: true,
            service: 'MediaPipe Pose Detection',
            ...response.data
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: `Errore rilevamento postura: ${error.message}` 
        });
    }
});

// === TTS ENDPOINTS ===

router.post('/synthesize-speech', async (req, res) => {
    try {
        const { text, language = 'en', speaker } = req.body;
        
        if (!text) {
            return res.status(400).json({ 
                success: false, 
                error: 'Testo richiesto per la sintesi vocale' 
            });
        }
        
        const response = await axios.post(`${AI_SERVICES.TTS}/synthesize`, {
            text,
            language,
            speaker
        }, { timeout: 15000 });
        
        res.json({
            success: true,
            service: 'Coqui TTS',
            ...response.data
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: `Errore sintesi vocale: ${error.message}` 
        });
    }
});

router.get('/tts-voices', async (req, res) => {
    try {
        const response = await axios.get(`${AI_SERVICES.TTS}/voices`, { timeout: 5000 });
        res.json({
            success: true,
            service: 'Coqui TTS',
            ...response.data
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: `Errore recupero voci: ${error.message}` 
        });
    }
});

// === STABLE DIFFUSION ENDPOINTS ===

router.post('/generate-image', async (req, res) => {
    try {
        const { 
            prompt, 
            negative_prompt = 'blurry, bad quality, distorted', 
            width = 256, // Ridotto per velocità
            height = 256, 
            steps = 10, // Ridotto da 20 a 10
            guidance_scale = 7.5 
        } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ 
                success: false, 
                error: 'Prompt richiesto per generare immagine' 
            });
        }
        
        const response = await axios.post(`${AI_SERVICES.STABLE_DIFFUSION}/generate`, {
            prompt,
            negative_prompt,
            width: Math.min(width, 512), // Massimo 512 per velocità
            height: Math.min(height, 512),
            steps: Math.min(steps, 15), // Ridotto massimo steps
            guidance_scale
        }, { timeout: 60000 }); // Ridotto timeout da 2 minuti a 1
        
        res.json({
            success: true,
            service: 'Stable Diffusion',
            ...response.data
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: `Errore generazione immagine: ${error.message}` 
        });
    }
});

// === OLLAMA/AI CHAT ENDPOINTS ===

router.post('/chat', async (req, res) => {
    try {
        const { message, model = 'llama3.1:8b', system_prompt } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Messaggio richiesto per la chat' 
            });
        }
        
        let prompt = message;
        if (system_prompt) {
            prompt = `${system_prompt}\n\nUser: ${message}\nAssistant:`;
        }
        
        const response = await axios.post(`${AI_SERVICES.OLLAMA}/api/generate`, {
            model,
            prompt,
            stream: false,
            options: {
                temperature: 0.7,
                top_p: 0.9
            }
        }, { timeout: 30000 });
        
        res.json({
            success: true,
            service: 'Ollama LLM',
            response: response.data.response,
            model: response.data.model,
            created_at: response.data.created_at,
            user_message: message
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: `Errore chat AI: ${error.message}` 
        });
    }
});

// === UGO AI ORCHESTRAZIONE ===

router.post('/ugo-complete', async (req, res) => {
    try {
        const { action, data } = req.body;
        
        switch (action) {
            case 'analyze_and_describe':
                if (!data?.image) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Immagine richiesta per l\'analisi' 
                    });
                }
                
                // 1. Analizza immagine
                const analysis = await axios.post(`${AI_SERVICES.MEDIAPIPE}/detect_faces`, {
                    image: data.image
                }, { timeout: 10000 });
                
                // 2. Genera descrizione
                const prompt = `Descrivi creativamente un'immagine che contiene ${analysis.data.count || 0} volti. Sii descrittivo e coinvolgente.`;
                const description = await axios.post(`${AI_SERVICES.OLLAMA}/api/generate`, {
                    model: 'llama3.1:8b',
                    prompt,
                    stream: false
                }, { timeout: 30000 });
                
                res.json({
                    success: true,
                    action: 'analyze_and_describe',
                    faces: analysis.data,
                    description: description.data.response,
                    timestamp: new Date().toISOString()
                });
                break;
                
            case 'text_to_multimodal':
                if (!data?.text) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Testo richiesto' 
                    });
                }
                
                // Genera immagine e audio in parallelo
                const [imageResult, audioResult] = await Promise.allSettled([
                    axios.post(`${AI_SERVICES.STABLE_DIFFUSION}/generate`, {
                        prompt: data.text,
                        width: 512,
                        height: 512,
                        steps: 20
                    }, { timeout: 120000 }),
                    axios.post(`${AI_SERVICES.TTS}/synthesize`, {
                        text: data.text
                    }, { timeout: 15000 })
                ]);
                
                const result = {
                    success: true,
                    action: 'text_to_multimodal',
                    original_text: data.text,
                    timestamp: new Date().toISOString()
                };
                
                if (imageResult.status === 'fulfilled') {
                    result.image = imageResult.value.data;
                } else {
                    result.image_error = imageResult.reason.message;
                }
                
                if (audioResult.status === 'fulfilled') {
                    result.audio = audioResult.value.data;
                } else {
                    result.audio_error = audioResult.reason.message;
                }
                
                res.json(result);
                break;
                
            default:
                res.status(400).json({ 
                    success: false, 
                    error: `Azione sconosciuta: ${action}` 
                });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: `Errore orchestrazione UGO: ${error.message}` 
        });
    }
});

module.exports = router;
