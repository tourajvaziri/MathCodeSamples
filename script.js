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

  setInterval(claculateValues, 1000);
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
  drawStats();
  drawGraph();

  if (pauseCalculation) {
    wheels.forEach((wheel) => {
      wheel.p = wheel.pos.copy();
    })
  }
  else {
    applyVerlet(0.01);

    for (let i = 0; i < 8; i++) {
      applyConstraints();
    }
  }

  //if (mouseIsPressed) {
  //  addGround(scroll.x + mouseX, (keyIsDown(SHIFT) ? -1 : 1) * 2, 100);
  //}
}

function keyPressed() {
  if (key === ' ') {
    // paused = !paused;
  }
  if (key === 'r') {
    groundHeights = {};
    initializeCar();
    startTime = millis();
    elapsedTime = 0;
  }
  if (key === ' ') {
    if (pauseCalculation) {
      pauseCalculation = false
    }
    else {
      pauseCalculation = true;
    }

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
  wheels.forEach((wheel) => {
    wheel.pos.add(createVector(0, 0.03));
  });

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



//************** My code *********** ///////

// Declare variables outside the draw function
let startTime;
let elapsedTime = 0;

let timer = 0;
let displacement = 0;

let currectDisplacement = 0;
let currentTime = 0
let averageVelocity = 0
let previousDisplacement = 0;
let instantanousVelocity = 0;
let pauseCalculation = false;
let timeArray = [0];
let displacementArray = [0];

function claculateValues() {
  if (pauseCalculation) {
    return;
  }
  let wheel1 = wheelById('wheel1')
  if (wheel1.pos != undefined) {
    previousDisplacement = currectDisplacement;
    currectDisplacement = Math.floor(wheel1.pos.x / 100);
    displacementArray.push(currectDisplacement);
  }

  currentTime = currentTime + 1;
  timeArray.push(currentTime);

  averageVelocity = floor((currectDisplacement / currentTime) * 100) / 100;

  instantanousVelocity = floor((currectDisplacement - previousDisplacement) * 100) / 100;
}

function drawStats() {

  fill(0); // Set the text color (black in this case)
  textSize(24);
  textAlign(CENTER, CENTER); // Center the text
  text("Displacement: " + currectDisplacement, width / 2, height / 2 - 20); // Display text at the center of the canvas

  // Draw the second text below the first one with the calculated time
  text("Time: " + currentTime + " seconds", width / 2, height / 2 + 20);

  text("Average Velocity: " + averageVelocity + " m/s", width / 2, height / 2 + 40);

  text("Instantanous Velocity: " + instantanousVelocity + " m/s", width / 2, height / 2 + 60);
}

function drawGraph() {
  let graphwidth = (width / 2) - 50;
  let graphHeight = (height / 2) - 50;

  // Draw axes
  line(50, graphHeight - 50, graphwidth - 50, graphHeight - 50);
  line(50, 50, 50, graphHeight - 50);

  // Draw axis labels
  fill(0);
  textSize(12);
  textAlign(CENTER, CENTER);

  // X-axis labels
  for (let i = 0; i <= 200; i += 10) {
    let x = map(i, 0, 200, 50, graphwidth - 50);
    text(i, x, graphHeight - 30);
  }
  text('Time', graphwidth / 2, graphHeight - 20);

  // Y-axis labels
  for (let i = 0; i <= height - 100; i += 50) {
    let y = map(i, 0, graphHeight - 100, graphHeight - 50, 50);
    text(i, 30, y);
  }
  text('Displacement', 20, graphHeight / 2);

  // Draw data points
  for (let i = 0; i < timeArray.length; i++) {
    let x = map(timeArray[i], 0, 200, 50, graphwidth - 50);
    let y = map(displacementArray[i], 0, graphHeight - 100, graphHeight - 50, 50);

    stroke(0, 0, 255); // Set the fill color to blue
    ellipse(x, y, 0.5, 0.5);

    // Connect points with lines
    if (i > 0 && timeArray.length > 1) {
      let prevX = map(timeArray[i - 1], 0, 200, 50, graphwidth - 50);
      let prevY = map(displacementArray[i - 1], 0, graphHeight - 100, graphHeight - 50, 50);

      stroke(255, 0, 0); // red
      line(prevX, prevY, x, y);
    }
  }
}