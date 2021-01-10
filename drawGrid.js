// temp func to show grid lines
function drawGrid() {
  if (false) {
    const colours = ["red", "yellow", "green", "white", "orange"];
    for (let i = 0; i <= numberOfLetters; i++) {
      // draw lines in between
      drawLineXForwards({
        initialCoords: [
          letterWidth * i + paddingAroundLetters * i,
          paddingAroundLetters,
        ],
        yPositionOffset: 0,
        length: paddingAroundLetters,
        colour: colours[2],
      });

      drawLineXForwards({
        initialCoords: [
          letterWidth * i + paddingAroundLetters * (i + 1),
          paddingAroundLetters,
        ],
        yPositionOffset: 0,
        length: letterWidth,
        colour: colours[3],
      });

      drawLineXForwards({
        initialCoords: [
          letterWidth * i + paddingAroundLetters * i,
          height - paddingAroundLetters,
        ],
        yPositionOffset: 0,
        length: paddingAroundLetters,
        colour: colours[2],
      });

      drawLineXForwards({
        initialCoords: [
          letterWidth * i + paddingAroundLetters * (i + 1),
          height - paddingAroundLetters,
        ],
        yPositionOffset: 0,
        length: letterWidth,
        colour: colours[3],
      });
    }
  }
}
