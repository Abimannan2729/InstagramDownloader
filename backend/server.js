const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

app.post("/api/download", async (req, res) => {
  const { url, preview } = req.body;

  if (!url) return res.status(400).json({ error: "No URL provided" });

  try {
    // Fetch the Instagram page HTML
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
      },
    });

    const html = response.data;

    // Extract JSON data containing media info
    const regex = /<script type="text\/javascript">window\._sharedData = (.+);<\/script>/;
    const match = html.match(regex);

    if (!match) return res.status(404).json({ error: "Media not found" });

    const sharedData = JSON.parse(match[1]);
    const mediaData =
      sharedData.entry_data.PostPage[0].graphql.shortcode_media;

    // Normalize media into an array
    let media = [];
    if (mediaData.__typename === "GraphImage") {
      media.push({ type: "image", url: mediaData.display_url });
    } else if (mediaData.__typename === "GraphVideo") {
      media.push({ type: "video", url: mediaData.video_url });
    } else if (mediaData.__typename === "GraphSidecar") {
      mediaData.edge_sidecar_to_children.edges.forEach((edge) => {
        if (edge.node.is_video) {
          media.push({ type: "video", url: edge.node.video_url });
        } else {
          media.push({ type: "image", url: edge.node.display_url });
        }
      });
    }

    return res.json({ media });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Failed to fetch media" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
