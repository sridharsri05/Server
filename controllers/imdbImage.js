// const axios = require("axios");
// const cheerio = require("cheerio");

// const imdbImage = async (req, res) => {
//   const { imdbId } = req.body; // Use req.body instead of req.params for POST requests


//   try {
//     const imdbUrl = `https://www.imdb.com/title/${imdbId}/`;

//     const response = await axios.get(imdbUrl, {
//       headers: {
//         "User-Agent":
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
//       },
//     });

//     const $ = cheerio.load(response.data);
//     const imageUrl = $("div.ipc-media img.ipc-image").attr("src");

//     console.log("IMDB ", imageUrl);

//     if (imageUrl) {
//       res.status(200).json({ imageUrl, status: "success" });
//     } else {
//       res.status(404).json({ error: "Image not found" });
//     }
//   } catch (error) {
//     console.error("Error fetching IMDb image:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// module.exports = {
//   imdbImage,
// };
const axios = require("axios");
const cheerio = require("cheerio");

const imdbImage = async (imdbId) => {
  try {
    const imdbUrl = `https://www.imdb.com/title/${imdbId}/`;

    const response = await axios.get(imdbUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
      },
    });

    const $ = cheerio.load(response.data);
    const imageUrl = $("div.ipc-media img.ipc-image").attr("src");

    console.log("IMDB ", imageUrl);

    if (imageUrl) {
      return { imageUrl, status: "success" };
    } else {
      return { error: "Image not found" };
    }
  } catch (error) {
    console.error("Error fetching IMDb image:", error);
    return { error: "Internal Server Error" };
  }
};

module.exports = {
  imdbImage,
};
