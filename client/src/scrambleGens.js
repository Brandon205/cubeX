export function get3x3Scramble() { 
  var test = []
  let possible = ["F", "F'", "F2", "B", "B'", "B2", "U", "U'", "U2", "D", "D'", "D2", "R", "R'", "R2", "L", "L'", "F2", ]
  for (let i = 0; i < 21; i++) {
    let toPush = possible[Math.floor(Math.random() * 18)]
    if (test.length > 1) {
      while (test[test.length - 1].charAt(0) === toPush.charAt(0)) {
        toPush = possible[Math.floor(Math.random() * 18)]
      }
    }
    test.push(toPush)
  }
  // var testStr = test.join(' ')
  return test.join(' ')
}