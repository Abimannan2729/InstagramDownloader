const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// POST /api/download
// Accepts { url, preview, mediaUrl }
// - preview: returns all media info
// - mediaUrl: downloads the specific media
app.post('/api/download', async (req, res) => {
  const { url, preview, mediaUrl } = req.body;

  try {
    if (mediaUrl) {
      // Download specific media directly
      const type = mediaUrl.endsWith('.mp4') ? 'video' : 'image';
      const filename = type === 'video' ? 'instagram_video.mp4' : 'instagram_image.jpg';
      const mediaResp = await axios.get(mediaUrl, { responseType: 'stream' });
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', type === 'video' ? 'video/mp4' : 'image/jpeg');
      return mediaResp.data.pipe(res);
    }

    if (!url) return res.status(400).json({ error: 'No URL provided' });

    // Fetch Instagram page HTML
    const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);

    let mediaList = [];

    // Parse JSON from <script type="application/ld+json">
    const scriptTag = $('script[type="application/ld+json"]').html();
    if (scriptTag) {
      const jsonData = JSON.parse(scriptTag);
      if (jsonData.image) {
        if (Array.isArray(jsonData.image)) jsonData.image.forEach(item => mediaList.push({ url: item, type: 'image' }));
        else mediaList.push({ url: jsonData.image, type: 'image' });
      }
      if (jsonData.video) {
        if (Array.isArray(jsonData.video)) jsonData.video.forEach(item => mediaList.push({ url: item, type: 'video' }));
        else mediaList.push({ url: jsonData.video, type: 'video' });
      }
    }

    // Fallback: og tags
    if (mediaList.length === 0) {
      const ogVideo = $('meta[property="og:video"]').attr('content');
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogVideo) mediaList.push({ url: ogVideo, type: 'video' });
      if (ogImage) mediaList.push({ url: ogImage, type: 'image' });
    }

    if (mediaList.length === 0) throw new Error('Unable to extract media');

    if (preview) return res.json({ media: mediaList });

    // Download first media by default if no mediaUrl specified
    const first = mediaList[0];
    const type = first.type;
    const filename = type === 'video' ? 'instagram_video.mp4' : 'instagram_image.jpg';
    const mediaResp = await axios.get(first.url, { responseType: 'stream' });
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', type === 'video' ? 'video/mp4' : 'image/jpeg');
    mediaResp.data.pipe(res);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log('Backend running on http://localhost:5000'));
