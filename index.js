const express = require('express')
const cors = require('cors')
const axios = require('axios')
const cheerio = require('cheerio') 
const ytdl = require('@distube/ytdl-core')
const validator = require('validator')


const app = express()

const corsOptions = {
    origin: '*', // Permite solicitudes desde cualquier origen
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos HTTP permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Encabezados permitidos
  };
app.use(cors(corsOptions))
app.use(express.json())

// Ruta para escanear la paguina 
app.post("/api/scrape", async (req, res)=>{
    const {url} = req.body 
    try {
         // Validar la URL
            if (!validator.isURL(url)) {
            return res.status(400).json({ error: 'La URL ingresada no es válida' });
      }
        if(ytdl.validateURL(url)) {
            // extraes la informacion de youtube 
            const info = await ytdl.getInfo(url)
            const videoUrl = info.formats.find(format => format.itag === 18)?.url // formato MP4
            if (videoUrl) {
                return res.json({
                    media: [{type: "video", path: videoUrl}]
                })
            }else {
                return res.status(404).json({message: "Video not found"})
            }
        }
        // carga la url en cheerio
        const {data} = await axios.get(url)
        const $ = cheerio.load(data)
        const media =[]

        // buscamos las imagenes 
        $("img").each( (index, elem)=>{
            let src = $(elem).attr("src")
            if(src) {
                let path = new URL(src, url).href
                    media.push({type: "image", path})
            }
        })

        // buscamos los videos 
        $("video source").each((index, elem)=>{
            const src = $(elem).attr("src")
            if(src) {
                let path = src
                media.push({type: "video", path})
            }
        })
        res.json({media})

    }
    catch (error) {
        console.log(error)
        res.status(500).json({message: "Error"})
    }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`)
})