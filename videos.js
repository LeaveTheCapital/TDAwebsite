const videos = [
  // certain standards
  "https://www.youtube.com/embed/7H_MJrVRLzc",
  // mixed up messed up guy
  "https://www.youtube.com/embed/CCvEL8oDZyk",
  // hamsickle
  "https://www.youtube.com/embed/iP6P0IRdBV4",
  // nylon
  "https://www.youtube.com/embed/VU0vKZUsfuo",
  // jam jar
  "https://www.youtube.com/embed/2WKkPkL6RGY",
  // sick & tired
  "https://www.youtube.com/embed/YkQ0VyIIYk4",
  // mugs game
  "https://www.youtube.com/embed/iFbDbgC3URE",
  // GCSEs
  "https://www.youtube.com/embed/CB7HqPtYelg",
  // Donkey
  "https://www.youtube.com/embed/Obplst-KyEs"
];

const videoIFrames = videos
  .map(videoUrl => {
    const vidEle = document.createElement("iframe");
    vidEle.className = "vids";
    vidEle.src = videoUrl;
    return vidEle;
  })
  .forEach((vidIFrame, i) => {
    window.setTimeout(() => {
      const videoSection = document.getElementById("vid-container");
      videoSection.appendChild(vidIFrame);
    }, 400 * (i + 1));
  });
