// let nameButton = document.getElementById("name-button");
// let nameInput = document.getElementById("name-input");
// let wassup = document.getElementById("wassup");
// let wassupStyle = wassup.style;
// wassupStyle.color = "white";
// let rndColour = "yellow";
// let rndRed = Math.random() * 255;
// let rndGreen = Math.random() * 255;
// let rndBlue = Math.random() * 255;
// rndColour = `rgb(${rndRed},${rndGreen},${rndBlue})`;
// wassupStyle.backgroundColor = rndColour;

// nameButton.onclick = getName;

// let iFrequency = 200;
// let i = 0;
// let myInterval = setInterval(doSomething, iFrequency);

// function doSomething() {
//   if (i > 6) {
//     window.clearInterval(myInterval);
//     return;
//   }
//   rndRed = Math.floor(Math.random() * 255);
//   rndGreen = Math.floor(Math.random() * 255);
//   rndBlue = Math.floor(Math.random() * 255);
//   rndColour = `rgb(${rndRed},${rndGreen},${rndBlue})`;
//   wassupStyle.backgroundColor = rndColour;
//   iFrequency = Math.random() * 150;
//   window.clearInterval(myInterval);
//   myInterval = setInterval(doSomething, iFrequency);
//   i++;
// }

// function getName() {
//   let name = nameInput.value;
//   console.log(name);

//   let i = 0;
//   let j = 0;
//   let wassup = document.getElementById("wassup");

//   var interval = setInterval(() => {
//     wassup.innerHTML += name.charAt(i);
//     j++;
//     i++;
//     if (i > name.length) {
//       wassup.innerHTML = wassup.innerHTML.slice(0, -1) + "_";
//       i -= 2;
//       // clearInterval(interval);
//     }
//     if (j > 15) {
//       clearInterval(interval);
//       nameButton.parentNode.removeChild(nameButton);
//       setTimeout(() => {
//         nameInput.parentNode.removeChild(nameInput);
//       }, 200);
//     }
//   }, 100);
// }
