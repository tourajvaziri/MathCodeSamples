let primaryStroke;

let wheels = []
let connections = [];
let checkPrecision = 1;

let groundHeights = {}; // store all x coords known

let paused = false;

let img;
let img2;

function preload() {
  img = loadImage('school.png');
  img2 = loadImage('student.png');
}

function setup() {
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
  drawDisplacementGraph();
  drawVeclocityNewGraph();
  drawAccelerationGraph();
  //drawVelocityGraph();

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
    initializeValues();
  }
  if (key === ' ') {
    if (pauseCalculation) {
      pauseCalculation = false
    }
    else {
      pauseCalculation = true;
    }
  }
  if (key === 'w') {
    if (moveSpeed < 4) {
      moveSpeed = moveSpeed + 1;
    }
  }
  if (key === 'x') {
    if (moveSpeed > 1) {
      moveSpeed = moveSpeed - 1;
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

  // handleControls(0.1);

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

function handleControls3(moveSpeed) {
  let controlDir = (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) ? 'right' : ((keyIsDown(LEFT_ARROW) || keyIsDown(65)) ? 'left' : null);
  if (controlDir) {
    wheels.forEach((wheel) => {
      if (wheel.control.includes(controlDir) && isTouchingGround(wheel)) {
        wheel.pos.x += moveSpeed; // Updated to only increase position by a constant
      }
    });
  }
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
let currentDisplacement = 0.0;
let currentTime = 0.0
let averageVelocity = 0.0
let previousDisplacement = 0.0;
let previousVelocity = 0.0;
let instantanousVelocity = 0.0;
let instantanousAcceleration = 0.0;
let pauseCalculation = false;
let timeArray = [0.0];
let displacementArray = [0.0];
let velocityArray = [0.0];
let accelerationArray = [0.0];
let moveSpeed = 1.0;
let startTime = new Date().getTime();

function initializeValues() {
  currentDisplacement = 0.0;
  currentTime = 0.0;
  averageVelocity = 0.0
  previousDisplacement = 0.0;
  previousVelocity = 0.0;
  instantanousVelocity = 0.0;
  instantanousAcceleration = 0.0;
  pauseCalculation = false;
  timeArray = [0.0];
  displacementArray = [0.0];
  velocityArray = [0.0];
  accelerationArray = [0.0];
  moveSpeed = 1.0;
  startTime = new Date().getTime();
}


function claculateValues() {
  if (pauseCalculation) {
    return;
  }

  handleControlsNew();

  let wheel1 = wheelById('wheel1')
  if (wheel1.pos != undefined) {
    previousDisplacement = currentDisplacement;
    currentDisplacement = wheel1.pos.x / 100;
    displacementArray.push(currentDisplacement);

    // currentTime = (new Date().getTime() - startTime) / 1000; // in seconds
    currentTime = currentTime + 1;
    timeArray.push(currentTime);

    averageVelocity = currentDisplacement / currentTime;

    previousVelocity = instantanousVelocity;
    instantanousVelocity = currentDisplacement - previousDisplacement;
    velocityArray.push(instantanousVelocity);

    instantanousAcceleration = instantanousVelocity - previousVelocity;
    accelerationArray.push(instantanousAcceleration);
  }
}

function handleControlsNew() {
  let controlDir = (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) ? 'right' : ((keyIsDown(LEFT_ARROW) || keyIsDown(65)) ? 'left' : null);
  if (controlDir) {
    wheels.forEach((wheel) => {
      if (wheel.control.includes(controlDir)) {
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

function drawStats() {

  let xpistion = width - 500
  let yposition = 30
  fill(0); // Set the text color (black in this case)
  textSize(24);
  textAlign(LEFT, RIGHT); // Align the text to the left

  fill(255, 0, 0);
  text("Displacement: " + currentDisplacement.toFixed(4) + " m", xpistion, yposition + 20); // Display text at the center of the canvas

  fill(0, 0, 255);
  text("Instantanous Velocity: " + instantanousVelocity.toFixed(4) + " m/s", xpistion, yposition + 60);

  fill(155, 89, 182); // purple
  text("Instantanous Acceleration: " + instantanousAcceleration.toFixed(4) + " m/s^2", xpistion, yposition + 100);

  fill(0);
  text("Time: " + currentTime + " seconds", xpistion, yposition + 140);

  image(img, width - 60, height - 120, img.width / 3, img.height / 3); // displaying the image at half size

  image(img2, 10, height - 120, img.width / 3, img.height / 3); // displaying the image at half size
}

function drawDisplacementGraph() {
  let graphwidth = width - 50;
  let graphHeight = height - 100;

  let GraphXStartPosition = 50;
  let GraphYStartPosition = 50;
  let GraphXEndPosition = 50;
  let GraphYEndPosition = graphHeight - 450;

  // Draw axes

  // x axis line
  line(GraphXStartPosition, GraphYEndPosition, graphwidth - 50, GraphYEndPosition);

  // Y axis line
  line(GraphXStartPosition, GraphYStartPosition, GraphXEndPosition, GraphYEndPosition);

  // Draw axis labels
  fill(0);
  textSize(12);
  textAlign(CENTER, CENTER);

  let YValuesRange = 100
  let XValuesRange = 100

  // X-axis labels
  for (let i = 0; i <= XValuesRange; i += 10) {
    let x = map(i, 0, XValuesRange, 50, graphwidth - 50);
    text(i, x, GraphYEndPosition + 20);
  }
  text('Time', graphwidth - 30, GraphYEndPosition);

  // Y-axis labels
  for (let i = 0; i <= YValuesRange; i += 10) {
    let y = map(i, 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);
    text(i, 30, y);
  }
  text('Displacement', 50, GraphYStartPosition - 20);




  // Draw data points
  for (let i = 0; i < timeArray.length; i++) {
    let x = map(timeArray[i], 0, XValuesRange, GraphXStartPosition, graphwidth - 50);
    let y = map(displacementArray[i], 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);
    //  let z = map(velocityArray[i], 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);
    // let a = map(accelerationArray[i], 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);

    //   stroke(0, 0, 255); // Set the fill color to blue
    //  ellipse(x, y, 0.5, 0.5);

    // Connect points with lines
    if (i > 0 && timeArray.length > 1 && velocityArray.length > 1 && accelerationArray.length > 1) {
      let prevX = map(timeArray[i - 1], 0, XValuesRange, GraphXStartPosition, graphwidth - 50);
      let prevY = map(displacementArray[i - 1], 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);
      // let prevZ = map(velocityArray[i - 1], 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);
      // let prevA = map(accelerationArray[i - 1], 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);

      stroke(255, 0, 0); // red
      line(prevX, prevY, x, y);

      stroke(0, 0, 255); // blue
      //  line(prevX, prevZ, x, z);

      stroke(155, 89, 182);
      //  line(prevX, prevA, x, a);

      stroke(primaryStroke);
    }
  }
}


function drawVeclocityNewGraph() {
  let graphwidth = width - 50;
  let graphHeight = height - 100;

  let GraphXStartPosition = 50;
  let GraphYStartPosition = graphHeight - 380;
  let GraphXEndPosition = 50;
  let GraphYEndPosition = graphHeight - 220;

  // Draw axes

  // x axis line
  line(GraphXStartPosition, GraphYEndPosition, graphwidth - 50, GraphYEndPosition);

  // Y axis line
  line(GraphXStartPosition, GraphYStartPosition, GraphXEndPosition, GraphYEndPosition);

  // Draw axis labels
  fill(0);
  textSize(12);
  textAlign(CENTER, CENTER);

  let YValuesRange = 5
  let XValuesRange = 100

  // X-axis labels
  for (let i = 0; i <= XValuesRange; i += 10) {
    let x = map(i, 0, XValuesRange, 50, graphwidth - 50);
    text(i, x, GraphYEndPosition + 20);
  }
  text('Time', graphwidth - 30, GraphYEndPosition);

  // Y-axis labels
  for (let i = 0; i <= YValuesRange; i += 1) {
    let y = map(i, 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);
    text(i, 30, y);
  }
  text('Velocity', 50, GraphYStartPosition - 20);




  // Draw data points
  for (let i = 0; i < timeArray.length; i++) {
    let x = map(timeArray[i], 0, XValuesRange, GraphXStartPosition, graphwidth - 50);
    // let y = map(displacementArray[i], 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);
    let z = map(velocityArray[i], 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);
    // let a = map(accelerationArray[i], 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);

    //   stroke(0, 0, 255); // Set the fill color to blue
    //  ellipse(x, y, 0.5, 0.5);

    // Connect points with lines
    if (i > 0 && timeArray.length > 1 && velocityArray.length > 1 && accelerationArray.length > 1) {
      let prevX = map(timeArray[i - 1], 0, XValuesRange, GraphXStartPosition, graphwidth - 50);
      // let prevY = map(displacementArray[i - 1], 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);
      let prevZ = map(velocityArray[i - 1], 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);
      //  let prevA = map(accelerationArray[i - 1], 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);

      stroke(255, 0, 0); // red
      // line(prevX, prevY, x, y);

      stroke(0, 0, 255); // blue
      line(prevX, prevZ, x, z);

      stroke(155, 89, 182);
      //  line(prevX, prevA, x, a);

      stroke(primaryStroke);
    }
  }
}


function drawAccelerationGraph() {
  let graphwidth = width - 50;
  let graphHeight = height - 100;

  let GraphXStartPosition = 50;
  let GraphYStartPosition = graphHeight - 150;
  let GraphXEndPosition = 50;
  let GraphYEndPosition = graphHeight - 50;

  // Draw axes

  // x axis line
  line(GraphXStartPosition, GraphYEndPosition, graphwidth - 50, GraphYEndPosition);

  // Y axis line
  line(GraphXStartPosition, GraphYStartPosition, GraphXEndPosition, GraphYEndPosition);

  // Draw axis labels
  fill(0);
  textSize(12);
  textAlign(CENTER, CENTER);

  let YValuesRange = 3
  let XValuesRange = 100

  // X-axis labels
  for (let i = 0; i <= XValuesRange; i += 10) {
    let x = map(i, 0, XValuesRange, 50, graphwidth - 50);
    text(i, x, GraphYEndPosition + 20);
  }
  text('Time', graphwidth - 30, GraphYEndPosition);

  // Y-axis labels
  for (let i = 0; i <= YValuesRange; i += 1) {
    let y = map(i, 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);
    text(i, 30, y);
  }
  text('Acceleration', 50, GraphYStartPosition - 20);




  // Draw data points
  for (let i = 0; i < timeArray.length; i++) {
    let x = map(timeArray[i], 0, XValuesRange, GraphXStartPosition, graphwidth - 50);
    // let y = map(displacementArray[i], 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);
    // let z = map(velocityArray[i], 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);
    let a = map(accelerationArray[i], 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);

    //   stroke(0, 0, 255); // Set the fill color to blue
    //  ellipse(x, y, 0.5, 0.5);

    // Connect points with lines
    if (i > 0 && timeArray.length > 1 && velocityArray.length > 1 && accelerationArray.length > 1) {
      let prevX = map(timeArray[i - 1], 0, XValuesRange, GraphXStartPosition, graphwidth - 50);
      // let prevY = map(displacementArray[i - 1], 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);
      // let prevZ = map(velocityArray[i - 1], 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);
      let prevA = map(accelerationArray[i - 1], 0, YValuesRange, GraphYEndPosition, GraphYStartPosition);

      stroke(255, 0, 0); // red
      // line(prevX, prevY, x, y);

      stroke(0, 0, 255); // blue
      // line(prevX, prevZ, x, z);

      stroke(155, 89, 182);
      line(prevX, prevA, x, a);

      stroke(primaryStroke);
    }
  }
}



function drawVelocityGraph() {
  let graphwidth = (width / 2) - 50;
  let graphHeight = (height / 2) - 50;

  // x axis line
  line(graphwidth + 100, GraphYPosition, width - 50, GraphYPosition);

  // Y axis line
  line(graphwidth + 100, 50, graphwidth + 100, GraphYPosition);

  // Draw axis labels
  fill(0);
  textSize(12);
  textAlign(CENTER, CENTER);

  // X-axis labels
  for (let i = 0; i <= 200; i += 10) {
    let x = map(i, 0, 200, graphwidth + 100, width - 50);
    text(i, x, graphHeight - 30);
  }
  text('Time', width - 30, GraphYPosition);

  // Y-axis labels
  for (let i = 0; i <= 20; i += 5) {
    let y = map(i, 0, 20, GraphYPosition, 50);
    text(i, graphwidth + 80, y);
  }
  text('Velocity', graphwidth + 100, 30);

  // Draw data points
  for (let i = 0; i < timeArray.length; i++) {
    let x = map(timeArray[i], 0, 200, graphwidth + 100, width - 50);
    let y = map(velocityArray[i], 0, 20, GraphYPosition, 50);

    //  stroke(0, 0, 255); // Set the fill color to blue
    //  ellipse(x, y, 0.5, 0.5);

    // Connect points with lines
    if (i > 0 && timeArray.length > 1) {
      let prevX = map(timeArray[i - 1], 0, 200, graphwidth + 100, width - 50);
      let prevY = map(velocityArray[i - 1], 0, 20, GraphYPosition, 50);

      stroke(0, 0, 255); // blue
      line(prevX, prevY, x, y);
      stroke(primaryStroke);
    }
  }
}