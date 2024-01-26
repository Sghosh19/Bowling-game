var SpeedIndicator = function () {
    var levels = [Level1, Level2, Level3, Level4, Level5, Level6, Level7, Level8]
    this.selectedLevel = 1
    this.start = function () {
        shouldAnimate = true
        levels.forEach((level) => {
            level.setColor('yellow')
        })
        levels[0].setColor('red')
        this.selectedLevel = 1
        Hatch.createTimer('ColorAnimator', 100, function () {
            if (that.selectedLevel < levels.length) {
                levels[that.selectedLevel++].setColor('red')
            } else {
                levels.forEach((level) => {
                    level.setColor('yellow')
                })
                levels[0].setColor('red')
                that.selectedLevel = 1
            }
        })
    }
    this.stop = function () {
        Hatch.removeTimer('ColorAnimator')
    }
    var that = this
}
var PinManager = function () {
    Pin.setVisible(false)
    var horizontalDistanceBetweenPins = 1.3;
    var verticalDistanceBetweenPins = 1.3;
    var initialX = (-3 * horizontalDistanceBetweenPins) / 2;
    var initialZ = -4.5 - 1.22;
    this.pins = []
    this.fallenPins = []
    this.steadyPins = []
    var createPin = function (i, j) {
        return new Promise((resolve, reject) => {
            Hatch.cloneObject(Pin, function (clonedObject) {
                turnOffPhysics(clonedObject);
                clonedObject.setX(
                    initialX +
                    (4 - j) * horizontalDistanceBetweenPins +
                    ((i - 4) * horizontalDistanceBetweenPins) / 2
                );
                clonedObject.setY(1.08);
                clonedObject.setZ(initialZ + (4 - i) * verticalDistanceBetweenPins);
                clonedObject.setVisible(true);
                that.pins.push(clonedObject);
                that.steadyPins.push(clonedObject);
                resolve()
            });
        })
    }
    this.createPins = async function () {
        for (var i = 4; i >= 1; i--) {
            for (j = i; j >= 1; j--) {
                await createPin(i, j);
            }
        }
    }
    this.enablePhysics = function () {
        this.pins.forEach((pin) => {
            enablePhysics(pin, 'dynamic-body')
        })
    }
    this.disablePhysics = function () {
        this.pins.forEach((pin) => {
            turnOffPhysics(pin)
        })
    }
    this.calculateFallenPins = function () {
        if (this.fallenPins.length > 0) {
            this.fallenPins = this.steadyPins.filter((pin) => {
                return (Math.abs(pin.getRotation().x) > 10 || Math.abs(pin.getRotation().z) > 10)
            })
        } else {
            this.fallenPins = this.pins.filter((pin) => {
                return (Math.abs(pin.getRotation().x) > 10 || Math.abs(pin.getRotation().z) > 10)
            })
        }
        this.steadyPins = this.pins.filter((pin) => {
            return (Math.abs(pin.getRotation().x) <= 10 && Math.abs(pin.getRotation().z) <= 10)
        })
    }
    this.slideBackPins = function () {
        var fps = 60
        return new Promise((resolve, reject) => {
            Hatch.createTimer('SlideBack', 1000 / fps, function () {
                if (fps == 0) {
                    Hatch.removeTimer('SlideBack')
                    resolve()
                } else {
                    that.pins.forEach((pin) => {
                        pin.setZ(pin.getZ() - 0.2)
                    })
                    fps--
                }
            })
        })
    }
    this.liftDownPins = function () {
        var fps = 60
        return new Promise((resolve, reject) => {
            Hatch.createTimer('LiftUp', 1000 / fps, function () {
                if (fps == 0) {
                    Hatch.removeTimer('LiftUp')
                    that.fallenPins = []
                    that.steadyPins = []
                    that.pins.forEach((pin) => { that.steadyPins.push(pin) })
                    resolve()
                } else {
                    that.pins.forEach((pin) => {
                        pin.setY(pin.getY() > 1.18 ? pin.getY() - 0.1 : 1.08)
                    })
                    fps--
                }
            })
        })
    }
    this.rearrangePins = function () {
        var k = 0
        for (var i = 4; i >= 1; i--) {
            for (j = i; j >= 1; j--) {
                replacePinAt(that.pins[k++], i, j)
            }
        }
    }
    var replacePinAt = function (pin, i, j) {
        pin.setRotationX(0)
        pin.setRotationY(0)
        pin.setRotationZ(0)
        pin.setX(initialX + (4 - j) * horizontalDistanceBetweenPins + (i - 4) * horizontalDistanceBetweenPins / 2)
        pin.setY(6.99)
        pin.setZ(initialZ + (4 - i) * verticalDistanceBetweenPins)
        pin.setVisible(true)
    }
    var that = this
}
var BallManager = function () {
    var init = function () {
        setupCollisionDetection()
    }
    var speed = 0
    var mass = 12
    var playHitSound = true
    var setupCollisionDetection = function () {
        Ball.onCollisionWithPhysicsBody(function (collidedObject) {
            var collidedWithPin = false
            pinManager.pins.forEach((pin) => {
                if (pin.id == collidedObject.id && playHitSound) {
                    collidedWithPin = true
                    Roll_sound.stopSound()
                    Hit_sound.playSound()
                    playHitSound = false
                }
            })
        });
    }
    this.throwBall = function (direction, speedLevel) {
        speed = 30 * speedLevel / mass
        Ball.setBodyVelocity(direction.x * speed, 0, direction.z * speed);
        Roll_sound.playSound()
        setTimeout(() => {
        }, (40 / speed) * 1000 * 2 / 3)

        setTimeout(() => {
            prepareForNextThrow()
        }, (40 / speed) * 1000 + 5000)
    }
    this.resetBall = function () {
        Ball.setBodyVelocity(0, 0, 0)
        Ball.setBodyAngularVelocity(0, 0, 0)
        Ball.moveDynamicBodyTo(0, 0.6, 28)
        Ball.setVisible(true)
        playHitSound = true
    }
    var that = this
    init()
}
var speedIndicator = new SpeedIndicator()
var pinManager = new PinManager()
var ballManager = new BallManager()
var p1TotalScore = 0
var p2TotalScore = 0
var p11Text = 'P1    |'
var p12Text = '|'
var p21Text = 'P2    |'
var p22Text = '|'
var roundScore = 0
initScene();
async function initScene() {
    await pinManager.createPins()
    speedIndicator.start()
    P1_BG.setVisible(true)
    P2_BG.setVisible(false)
    P11.setText(p11Text)
    P12.setText(p12Text)
    P21.setText(p21Text)
    P22.setText(p22Text)
}
var numberOfAttempts = 0
var disableClick = false
var playerTurn = 1
var numberOfRounds = 1
Hatch.onSceneClicked(function (event) {
    console.log('Clicking')
    if (disableClick) { return }
    console.log('Clicking succesful')
    disableClick = true
    pinManager.enablePhysics()
    speedIndicator.stop()
    var gazeDirection = Camera.getGazeDirection()
    ballManager.throwBall(gazeDirection, speedIndicator.selectedLevel)
    numberOfAttempts++
})
Hatch.onSceneTouchStart(function (event) {
    console.log('Clicking')
    if (disableClick) { return }
    console.log('Clicking succesful')
    disableClick = true
    pinManager.enablePhysics()
    speedIndicator.stop()
    var gazeDirection = Camera.getGazeDirection()
    ballManager.throwBall(gazeDirection, speedIndicator.selectedLevel)
    numberOfAttempts++
})
function prepareForNextThrow() {
    pinManager.calculateFallenPins()
    var score = pinManager.fallenPins.length
    roundScore += score
    if (numberOfAttempts == 1) {
        if (playerTurn == 1) {
            p1TotalScore += score
            if (score == 0) {
                p11Text += '  -  |'
                P11.setText(p11Text)
            }
            else if (score < 10) {
                p11Text += '  ' + score.toString() + '  |'
                P11.setText(p11Text)
            } else {
                p11Text += '     |'
                P11.setText(p11Text)
                p12Text += '  X  |'
                P12.setText(p12Text)
                prepareForNextRound()
                return
            }
        } else {
            p2TotalScore += score
            if (score == 0) {
                p21Text += '  -  |'
                P21.setText(p21Text)
            }
            else if (score < 10) {
                p21Text += '  ' + score.toString() + '  |'
                P21.setText(p21Text)
            } else {
                p21Text += '     |'
                P21.setText(p21Text)
                p22Text += '  X  |'
                P22.setText(p22Text)
                prepareForNextRound()
                return
            }
        }
    }
    else if (numberOfAttempts == 2) {
        if (playerTurn == 1) {
            p1TotalScore += score
            if (score == 0) {
                p12Text += '  -  |'
                P12.setText(p12Text)
            } else {
                p12Text += roundScore == 10 ? '  /  |' : '  ' + score.toString() + '  |'
                P12.setText(p12Text)
            }
        } else {
            p2TotalScore += score
            if (score == 0) {
                p22Text += '  -  |'
                P22.setText(p22Text)
            } else {
                p22Text += roundScore == 10 ? '  /  |' : '  ' + score.toString() + '  |'
                P22.setText(p22Text)
            }
        }
        prepareForNextRound()
        return
    }
    if (pinManager.steadyPins.length > 0) {
        ballManager.resetBall()
        speedIndicator.start()
        disableClick = false
    }
    else {
        prepareForNextRound()
    }
}
async function prepareForNextRound() {
    numberOfRounds++
    if (numberOfRounds == 21) {
        console.log(p1TotalScore)
        console.log(p2TotalScore)
        return
    }
    playerTurn = playerTurn == 1 ? 2 : 1
    P1_BG.setVisible(playerTurn == 1)
    P2_BG.setVisible(playerTurn == 2)
    numberOfAttempts = 0
    totalScore = 0
    roundScore = 0
    ballManager.resetBall()
    pinManager.disablePhysics()
    await pinManager.slideBackPins()
    pinManager.rearrangePins()
    await pinManager.liftDownPins()
    speedIndicator.start()
    disableClick = false
}
