let primaryStroke;

let wheels = []
let connections = [];
let checkPrecision = 1;

let groundHeights = {}; // store all x coords known

let paused = false;

function setup() {

  startTime = millis(); // Set the initial start time

  createCanvas(innerWidth, innerHeight);

  primaryStroke = color(255);

  initializeCar();

  noiseSeed(0);
}

function initializeCar() {
  wheels = [
    {
      id: 'wheel1',
      pos: createVector(100, 0),
      oldPos: createVector(100, 0),
      radius: 30,
      control: ['left', 'right']
    },
    {
      id: 'wheel2',
      pos: createVector(150, 0),
      oldPos: createVector(150, 0),
      radius: 30,
      control: ['left', 'right']
    }
  ];

  connections = [
    {
      ends: ['wheel1', 'wheel2'],
      length: 50,
      springiness: 0
    }
  ];
}

function getGroundHeight(x) {
  if (Object.keys(groundHeights).includes(round(x).toString())) {
    return groundHeights[round(x).toString()];
  }

  let inp = x - width / 2;

  let fOut = 10 * noise((x) / 100);

  return height - 50 - fOut;
}

function draw() {
  background(40);

  let scroll = getScroll();
  drawGround(scroll, 8);
  drawWheels(scroll);
  drawConnections(scroll);
  drawDisplacement();

  if (!paused) {
    applyVerlet(0.01);
  } else {
    wheels.forEach((wheel) => {
      wheel.oldPos = wheel.pos.copy();
    })
  }
  for (let i = 0; i < 8; i++) {
    applyConstraints();
  }

  if (mouseIsPressed) {
    addGround(scroll.x + mouseX, (keyIsDown(SHIFT) ? -1 : 1) * 2, 100);
  }
}

function keyPressed() {
  if (key === ' ') {
    paused = !paused;
  }
  if (key === 'r') {
    groundHeights = {};
    initializeCar();
    startTime = millis();
    elapsedTime = 0;
  }
}

function applyVerlet(friction) {
  wheels.forEach((wheel) => {
    let oldPos = wheel.oldPos;
    wheel.oldPos = JSON.parse(JSON.stringify(wheel.pos));
    let diff = createVector(wheel.pos.x - oldPos.x, wheel.pos.y - oldPos.y);
    wheel.pos.add(diff.mult(1 - friction));
  });
}

function applyConstraints() {
  if (!paused) {
    wheels.forEach((wheel) => {
      wheel.pos.add(createVector(0, 0.03));
    });
  }

  handleControls(0.1);

  wheels.forEach((wheel) => {
    let center = wheel.pos;
    let radius = wheel.radius;

    for (let x = center.x; abs(x - center.x) <= radius; x = center.x - (x - center.x + ((x > center.x) * 2 - 1) * checkPrecision)) {
      let center = wheel.pos;
      let radius = wheel.radius;

      let groundTop = createVector(x, getGroundHeight(x));
      if (center.dist(groundTop) < radius / 2) {
        let diff = p5.Vector.sub(center, groundTop);
        diff.setMag(radius / 2);
        wheel.pos = p5.Vector.add(groundTop, diff);
      }
    }
  });

  connections.forEach((connection) => {
    let ends = [wheelById(connection.ends[0]), wheelById(connection.ends[1])];
    let wheelConnection = createVector(ends[1].pos.x - ends[0].pos.x, ends[1].pos.y - ends[0].pos.y);
    let oldWheelConnection = wheelConnection.copy();

    wheelConnection.setMag(connection.length);

    ends[0].pos.x += (oldWheelConnection.x - wheelConnection.x) / 2 * (1 - connection.springiness);
    ends[0].pos.y += (oldWheelConnection.y - wheelConnection.y) / 2 * (1 - connection.springiness);

    ends[1].pos.x -= (oldWheelConnection.x - wheelConnection.x) / 2 * (1 - connection.springiness);
    ends[1].pos.y -= (oldWheelConnection.y - wheelConnection.y) / 2 * (1 - connection.springiness);
  });
}

function handleControls(moveSpeed) {
  let controlDir = (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) ? 'right' : ((keyIsDown(LEFT_ARROW) || keyIsDown(65)) ? 'left' : null);
  if (controlDir) {
    wheels.forEach((wheel) => {
      if (wheel.control.includes(controlDir) && isTouchingGround(wheel)) {
        let oldPos = wheel.oldPos;
        let pos = wheel.pos;

        let dir = createVector(pos.x - oldPos.x, pos.y - oldPos.y);
        dir.setMag(moveSpeed);
        if ((abs(dir.heading()) >= PI / 2 && controlDir === 'right') || (abs(dir.heading()) <= PI / 2 && controlDir === 'left')) {
          dir.mult(-1);
        }

        wheel.pos.add(dir);
      }
    });
  }
}

function isTouchingGround(wheel) {
  let center = wheel.pos;
  let radius = wheel.radius;

  for (let x = center.x; abs(x - center.x) <= radius; x = center.x - (x - center.x + ((x > center.x) * 2 - 1) * checkPrecision)) {
    let center = wheel.pos;
    let radius = wheel.radius;

    let groundTop = createVector(x, getGroundHeight(x));
    if (center.dist(groundTop) <= radius / 2) {
      return true;
    }
  }

  return false;
}

function wheelById(id) {
  matching = null;
  wheels.forEach((wheel) => {
    if (wheel.id === id) {
      matching = wheel;
      return;
    }
  });
  if (matching) {
    return matching;
  }
}

function wheelIndexById(id) {
  index = -1;
  wheels.forEach((wheel, i) => {
    if (wheel.id === id) {
      index = i;
      return;
    }
  });
  return index;
}

function drawGround(scroll, resolution) {
  let lastPoint;
  for (let x = 1; x - resolution < width; x += resolution) {
    let newPoint = createVector(x, getGroundHeight(x + scroll.x) - scroll.y);
    if (lastPoint) {
      line(lastPoint.x, lastPoint.y, newPoint.x, newPoint.y);
    }

    lastPoint = newPoint;
  }
}

function drawWheels(scroll) {
  noFill();
  stroke(primaryStroke);
  strokeWeight(5);
  wheels.forEach((wheel) => {
    circle(wheel.pos.x - scroll.x, wheel.pos.y - scroll.y, wheel.radius);
  });
}

function drawConnections(scroll) {
  stroke(primaryStroke);
  strokeWeight(5);
  connections.forEach((connection) => {
    let wheel1 = wheelById(connection.ends[0]);
    let wheel2 = wheelById(connection.ends[1]);
    line(wheel1.pos.x - scroll.x, wheel1.pos.y - scroll.y, wheel2.pos.x - scroll.x, wheel2.pos.y - scroll.y);
  });
}

function drawDisplacement() {
  // Draw text on the canvas
  textSize(32); // Set the text size
  fill(0); // Set the text color (black in this case)

  textSize(24);
  let wheel1 = wheelById('wheel1')
  if (wheel1.pos != undefined) {
    const posXWholeNumber = Math.floor(wheel1.pos.x / 100);
    textAlign(CENTER, CENTER); // Center the text
    text("Displacement: " + posXWholeNumber, width / 2, height / 2 - 20); // Display text at the center of the canvas
  }

  // Calculate elapsed time since the reset
  elapsedTime = millis() - startTime;
  let timeInSeconds = floor(elapsedTime / 1000);

  // Draw the second text below the first one with the calculated time

  text("Time: " + timeInSeconds + " seconds", width / 2, height / 2 + 20);
}

// Declare variables outside the draw function
let startTime;
let elapsedTime = 0;

let timer = 0;
let displacement = 0;

function drawGraph() {
  let wheel1 = wheelById('wheel1');
  const ctx = document.getElementById("myCanvas").getContext("2d");

  // Clear the entire canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Define time and displacement arrays (replace these with your actual data)
  const timeArray = [0, 1, 2, 3, 4, 5];
  const displacementArray = [0, 10, 20, 30, 40, 50];

  // Set up the graph parameters
  const scaleX = 50; // Horizontal scale factor
  const scaleY = 10; // Vertical scale factor
  const xOffset = 10; // X-axis offset
  const yOffset = 200; // Y-axis offset

  // Draw the line graph for displacement
  ctx.beginPath();
  ctx.moveTo(xOffset, yOffset - displacementArray[0] * scaleY);

  for (let i = 1; i < timeArray.length; i++) {
    const x = xOffset + timer * scaleX;
    const y = yOffset - displacementArray[i] * scaleY;
    ctx.lineTo(x, y);

    // Increment the timer and update displacement
    timer += timeArray[i];
    displacement = displacementArray[i];
  }

  // Draw axes for displacement
  ctx.moveTo(xOffset, yOffset);
  ctx.lineTo(xOffset + timer * scaleX, yOffset);
  ctx.moveTo(xOffset, 0);
  ctx.lineTo(xOffset, yOffset);

  // Stroke the path for displacement
  ctx.stroke();

  // Display time value separately
  ctx.font = "14px serif";
  ctx.fillText(`Time: ${timer} seconds`, 10, 20);

  // Draw the line graph for the division of displacement and time
  ctx.beginPath();
  ctx.moveTo(xOffset, yOffset - (displacement / timer) * scaleY);

  for (let i = 1; i < timeArray.length; i++) {
    const x = xOffset + timer * scaleX;
    const y = yOffset - (displacementArray[i] / timeArray[i]) * scaleY;
    ctx.lineTo(x, y);
  }

  // Draw axes for the division
  ctx.moveTo(xOffset, yOffset);
  ctx.lineTo(xOffset + timer * scaleX, yOffset);
  ctx.moveTo(xOffset, 0);
  ctx.lineTo(xOffset, yOffset);

  // Stroke the path for the division
  ctx.strokeStyle = "red"; // Change the color for clarity
  ctx.stroke();
}

function getScroll() {
  let avgWheelPos = createVector(0, 0);
  wheels.forEach((wheel) => {
    avgWheelPos.add(wheel.pos);
  });
  avgWheelPos.div(wheels.length);

  return createVector(avgWheelPos.x - width / 2, avgWheelPos.y - constrain(avgWheelPos.y, 80, height - 80));
}

function addGround(x, amount, spread) {
  for (let xOffset = -spread; xOffset <= spread; xOffset += 1) {
    groundHeights[round(x + xOffset)] = getGroundHeight(round(x + xOffset)) - (xOffset < 0 ? easeInOutCubic(0, amount, (spread + xOffset) / spread) : easeInOutCubic(amount, 0, xOffset / spread));
  }
}

function easeInOutCubic(a, b, t) {
  return lerp(a, b, t < 0.5 ? 4 * t ** 3 : 1 - pow(-2 * t + 2, 2) / 2);
}