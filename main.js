// Possible directions
const DIRECTIONS = {
  LEFT: "left",
  RIGHT: "right",
  UP: "up",
  DOWN: "down",
};

// Define them like regex
const CHARS = {
  START: "@",
  END: "x",
  HORIZONTAL: "-",
  VERTICAL: "|",
  LETTER: "A-Z",
  INTERSECTION: "+",
};

// Axis for intersection handling
const axis = {
  HORIZONTAL: [DIRECTIONS.LEFT, DIRECTIONS.RIGHT],
  VERTICAL: [DIRECTIONS.UP, DIRECTIONS.DOWN],
};

// Rules of chars moving from/to
const defineRegexRulesForNextMove = {
  [`[${CHARS.LETTER}${CHARS.END}${CHARS.INTERSECTION}${CHARS.START}]`]: [
    DIRECTIONS.UP,
    DIRECTIONS.DOWN,
    DIRECTIONS.LEFT,
    DIRECTIONS.RIGHT,
  ],
  [`[${CHARS.VERTICAL}]`]: [DIRECTIONS.UP, DIRECTIONS.DOWN],
  [`[${CHARS.HORIZONTAL}]`]: [DIRECTIONS.LEFT, DIRECTIONS.RIGHT],
};

// Error Classes
class ErrorNoDirections extends Error {
  constructor() {
    super("No possible directions");
  }
}

class ErrorMultipleDirections extends Error {
  constructor() {
    super("Multiple possible directions");
  }
}

class ErrorNoPosition extends Error {
  constructor() {
    super("No position");
  }
}

class ErrorMultiplePositions extends Error {
  constructor() {
    super("Multiple positions");
  }
}

// Helper funcs

// rotate axis directions
const rotateAxis = (direction) => {
  return isInArray({ array: axis.HORIZONTAL, element: direction })
    ? axis.VERTICAL
    : axis.HORIZONTAL;
};

// Possible moves based on position
const possibleMoves = (position) => ({
  [DIRECTIONS.UP]: { x: position.x - 1, y: position.y },
  [DIRECTIONS.DOWN]: { x: position.x + 1, y: position.y },
  [DIRECTIONS.LEFT]: { x: position.x, y: position.y - 1 },
  [DIRECTIONS.RIGHT]: { x: position.x, y: position.y + 1 },
});

//check if 2 positions are same
const samePosition = ({ position1, position2 }) => {
  if (position1.x === position2.x && position1.y === position2.y) {
    return true;
  }

  return false;
};

// Returns new possition
const handleMove = ({ position, direction }) => {
  return possibleMoves(position)[direction];
};

// finds position based on char
const findPositions = (matrix, char) => {
  const positions = [];

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j] === char) {
        positions.push({ x: i, y: j });
      }
    }
  }
  // Raise error if does not exist or multiple founds
  if (positions.length === 0) {
    return new ErrorNoPosition();
  } else if (positions.length > 1) {
    return new ErrorMultiplePositions();
  }

  return positions[0];
};

// pull char from matrix based on posiiton
const getChar = ({ matrix, position }) => {
  return matrix[position.x][position.y];
};

// checks if element is in array
const isInArray = ({ array, element }) => {
  return array.indexOf(element) > -1;
};

const matchRegex = ({ regex, char }) => {
  return new RegExp(regex).test(char);
};

// get directions based on current char rules
const getDirectionsByCharRules = ({ matrix, position }) => {
  for ([regex, compatibileDirections] of Object.entries(
    defineRegexRulesForNextMove
  )) {
    const char = getChar({ matrix, position });
    if (matchRegex({ regex, char })) {
      return compatibileDirections;
    }
  }
};

// filter directions based on direction, direction would provide us
// position and we will check if that char
// receives move from that direction
const filterDirectionsByCharRules = ({ matrix, position, directions }) => {
  const possibleDirections = [];
  for (direction of directions) {
    for ([regex, compatibileDirections] of Object.entries(
      defineRegexRulesForNextMove
    )) {
      const newPosition = handleMove({ position, direction });
      const char = getChar({ matrix, position: newPosition });
      if (matchRegex({ regex, char })) {
        if (isInArray({ array: compatibileDirections, element: direction })) {
          possibleDirections.push(direction);
        }
      }
    }
  }
  return possibleDirections;
};

// filter directions based on non/visited
const filterDirectionsByVisitedPositions = ({
  position,
  visitedPositions,
  directions,
  nonVisited = true,
}) => {
  return directions.filter((direction) => {
    const bool = visitedPositions.find((visitedPosition) =>
      samePosition({
        position1: handleMove({ position, direction }),
        position2: visitedPosition,
      })
    );
    return nonVisited ? !bool : bool;
  });
};

// filter directions based on possible indexes
const filterDirectionsByMatrixIndexes = ({ matrix, position, directions }) => {
  const filteredDirections = [];
  for (direction of directions) {
    try {
      // try to access element, better then checking horizontal and vertical indexes
      const newPosition = handleMove({ position, direction });
      if (!getChar({ matrix, position: newPosition })) {
        throw Error;
      }
      filteredDirections.push(direction);
    } catch {
      // ignore this is out of index
    }
  }
  return filteredDirections;
};

// func which is using multiple filters of directions
const getPossibleDirections = ({
  matrix,
  position,
  visitedPositions,
  matchMoveCharToRegex = true,
  nextDirection = false,
}) => {
  let directions = getDirectionsByCharRules({ matrix, position });

  // priorities direction
  if (nextDirection) {
    directions = [nextDirection];
  }

  return getFilteredDirections({
    matrix,
    position,
    visitedPositions,
    directions,
    matchMoveCharToRegex,
  });
};

// filter directions based on matrix, visited positions and char rules
const getFilteredDirections = ({
  matrix,
  position,
  visitedPositions,
  directions,
  matchMoveCharToRegex = true,
}) => {
  const filteredDirectionsByMatrixIndexes = filterDirectionsByMatrixIndexes({
    matrix,
    position,
    directions,
  });

  visitedPositions = visitedPositions.at(-1) ? [visitedPositions.at(-1)] : [];

  const filteredByLastPosition = filterDirectionsByVisitedPositions({
    position,
    visitedPositions,
    directions: filteredDirectionsByMatrixIndexes,
  });

  return matchMoveCharToRegex
    ? filterDirectionsByCharRules({
        matrix,
        position,
        directions: filteredByLastPosition,
      })
    : filteredByLastPosition;
};

// checks if bridge exists
const checkPossibleBridgeAndHandle = ({
  alreadyCheckedBridge,
  directions,
  matrix,
  position,
  direction,
  visitedPositions,
  letters,
  path,
}) => {
  // if we have not tryed bridge and there are no other way to go
  if (directions.length === 0 && !alreadyCheckedBridge) {
    return handleBridge({
      matrix,
      position,
      direction,
      visitedPositions,
      letters,
      path,
    });
  } else return false;
};

const checkIsDirectionCompatible = ({ directions, direction }) =>
  isInArray({ array: directions, element: direction });

const checkActingAsIntersectionAndHandle = ({
  directions,
  matrix,
  direction,
  position,
  visitedPositions,
  matchMoveCharToRegex,
  path,
  letters,
}) => {
  if (
    !checkIsDirectionCompatible({
      directions,
      direction,
    })
  ) {
    // add letter, handleIntersection will handle others
    letters = handleAddingLetter({
      visitedPositions,
      position,
      matrix,
      letters,
    });

    return handleIntersection({
      matrix,
      direction,
      position,
      visitedPositions,
      matchMoveCharToRegex,
      path,
      letters,
    });
  } else return false;
};

const handleAddingLetter = ({
  visitedPositions,
  position,
  matrix,
  letters,
}) => {
  // if not visited already
  const isAlreadyVisited = visitedPositions.find((visitedPosition) =>
    samePosition({ position1: visitedPosition, position2: position })
  );

  if (!isAlreadyVisited) {
    letters += getChar({ matrix, position });
  }

  return letters;
};

const checkActingAsVerticalAndHorizonalAndHandle = ({
  direction,
  position,
  visitedPositions,
  matrix,
  letters,
  path,
  matchMoveCharToRegex,
}) => {
  letters = handleAddingLetter({
    visitedPositions,
    position,
    matrix,
    letters,
  });

  path += getChar({ matrix, position });

  const newPosition = handleMove({ position, direction });

  return recursive({
    matrix,
    position: newPosition,
    direction,
    visitedPositions: [...visitedPositions, position],
    jump: matchMoveCharToRegex,
    letters,
    path,
  });
};

const checkMultipleDirectionsAndHandle = ({ directions }) => {
  if (directions.length > 1) {
    throw new ErrorMultipleDirections();
  }
};

const checkNoDirectionsAndHandle = ({ directions }) => {
  if (directions.length === 0) {
    throw new ErrorNoDirections();
  }
};

const handleBridge = ({
  matrix,
  position,
  direction,
  visitedPositions,
  letters,
  path,
}) => {
  return recursive({
    matrix,
    position,
    direction,
    letters,
    path,
    visitedPositions,
    matchMoveCharToRegex: false,
  });
};

const handleEnd = ({ letters, path }) => {
  return { letters: letters, path: path + CHARS.END };
};

const handleStart = ({ matrix, position, visitedPositions, letters, path }) => {
  const compatibileDirections = getPossibleDirections({
    matrix,
    position,
    visitedPositions,
  });

  checkMultipleDirectionsAndHandle({ directions: compatibileDirections });
  checkNoDirectionsAndHandle({
    directions: compatibileDirections,
  });

  // already checked if no empty
  const direction = compatibileDirections[0];

  const newPosition = handleMove({ position, direction });
  path += getChar({ matrix, position });

  return recursive({
    matrix,
    position: newPosition,
    direction,
    visitedPositions: [...visitedPositions, position],
    letters,
    path,
  });
};

const handleLetter = ({
  matrix,
  direction,
  matchMoveCharToRegex,
  nextDirection,
  position,
  visitedPositions,
  letters,
  path,
}) => {
  const compatibileDirections = getPossibleDirections({
    matrix,
    position,
    visitedPositions,
    matchMoveCharToRegex,
    nextDirection,
  });

  // try bridge
  const handledBridge = checkPossibleBridgeAndHandle({
    alreadyCheckedBridge: !matchMoveCharToRegex,
    directions: compatibileDirections,
    matrix,
    position,
    direction,
    visitedPositions,
    letters,
    path,
  });

  if (!handledBridge) {
    checkNoDirectionsAndHandle({
      directions: compatibileDirections,
    });
  }

  let handledIntersection = false;

  // if no bridge try intersection
  if (!handledBridge) {
    handledIntersection = checkActingAsIntersectionAndHandle({
      directions: compatibileDirections,
      matrix,
      direction,
      position,
      visitedPositions,
      matchMoveCharToRegex,
      path,
      letters,
    });
  }

  // if no bridge and intersection do vertical/horizonal move

  let handledVerticalAndHorizonal = false;
  if (!handledBridge && !handledIntersection) {
    handledVerticalAndHorizonal = checkActingAsVerticalAndHorizonalAndHandle({
      direction,
      matrix,
      position,
      visitedPositions,
      matchMoveCharToRegex,
      letters,
      path,
    });
  }

  return handledBridge || handledIntersection || handledVerticalAndHorizonal;
};

const handleVerticalAndHorizonal = ({
  matrix,
  direction,
  matchMoveCharToRegex,
  nextDirection,
  position,
  visitedPositions,
  letters,
  path,
}) => {
  const compatibileDirections = getPossibleDirections({
    matrix,
    position,
    visitedPositions,
    matchMoveCharToRegex,
    nextDirection,
  });

  checkMultipleDirectionsAndHandle({ directions: compatibileDirections });

  const handledBridge = checkPossibleBridgeAndHandle({
    alreadyCheckedBridge: !matchMoveCharToRegex,
    directions: compatibileDirections,
    matrix,
    position,
    direction,
    visitedPositions,
    letters,
    path,
  });

  if (!handledBridge) {
    checkNoDirectionsAndHandle({
      directions: compatibileDirections,
    });

    if (
      !checkIsDirectionCompatible({
        directions: compatibileDirections,
        direction,
      })
    ) {
      throw new ErrorNoDirections();
    }

    const newPosition = handleMove({ position, direction });

    path += getChar({ matrix, position });

    return recursive({
      matrix,
      position: newPosition,
      direction,
      visitedPositions: [...visitedPositions, position],
      nextDirection: matchMoveCharToRegex ? false : direction,
      letters,
      path,
    });
  } else return handledBridge;
};

const handleIntersection = ({
  matrix,
  direction,
  position,
  matchMoveCharToRegex,
  visitedPositions,
  letters,
  path,
}) => {
  const directions = rotateAxis(direction);

  let compatibileDirections = getFilteredDirections({
    matrix,
    position,
    visitedPositions,
    matchMoveCharToRegex,
    directions,
  });

  checkMultipleDirectionsAndHandle({
    directions: compatibileDirections,
  });

  const handledBridge = checkPossibleBridgeAndHandle({
    alreadyCheckedBridge: !matchMoveCharToRegex,
    directions: compatibileDirections,
    matrix,
    position,
    direction,
    visitedPositions,
    letters,
    path,
  });

  if (!handledBridge) {
    checkNoDirectionsAndHandle({
      directions: compatibileDirections,
    });

    direction = compatibileDirections[0];
    const newPosition = handleMove({ position, direction });

    path += getChar({ matrix, position });

    return recursive({
      matrix,
      position: newPosition,
      direction,
      letters,
      path,
      visitedPositions: [...visitedPositions, position],
      nextDirection: matchMoveCharToRegex ? false : direction,
      letters,
      path,
    });
  } else {
    return handledBridge;
  }
};

// Main Recursive Function
const recursive = ({
  matrix,
  position,
  matchMoveCharToRegex = true,
  nextDirection = false,
  direction = undefined,
  visitedPositions = [],
  letters = "",
  path = "",
}) => {
  const currentChar = getChar({ matrix, position });

  if (currentChar === CHARS.END) {
    return handleEnd({ letters, path });
  } else if (currentChar === CHARS.START) {
    return handleStart({
      matrix,
      position,
      visitedPositions,
      letters,
      path,
    });
  } else if (/[A-Z]/.test(currentChar)) {
    return handleLetter({
      matrix,
      direction,
      matchMoveCharToRegex,
      nextDirection,
      position,
      visitedPositions,
      letters,
      path,
    });
  } else if (
    currentChar === CHARS.VERTICAL ||
    currentChar === CHARS.HORIZONTAL
  ) {
    return handleVerticalAndHorizonal({
      matrix,
      direction,
      matchMoveCharToRegex,
      nextDirection,
      position,
      visitedPositions,
      letters,
      path,
    });
  } else if (currentChar === CHARS.INTERSECTION) {
    return handleIntersection({
      matrix,
      direction,
      position,
      visitedPositions,
      matchMoveCharToRegex,
      letters,
      path,
    });
  } else {
    throw Error();
  }
};

// Tests
const assert = (condition, message) => {
  if (!condition) {
    throw Error(message || "Error.");
  }
};

const testRotateAxis = () => {
  assert(rotateAxis(DIRECTIONS.UP) === axis.HORIZONTAL);
  assert(rotateAxis(DIRECTIONS.DOWN) === axis.HORIZONTAL);
  assert(rotateAxis(DIRECTIONS.LEFT) === axis.VERTICAL);
  assert(rotateAxis(DIRECTIONS.RIGHT) === axis.VERTICAL);
};

const testPossibleMoves = () => {
  let position = { x: 0, y: 0 };
  let moves = possibleMoves(position);
  assert(
    JSON.stringify(moves[DIRECTIONS.UP]) === JSON.stringify({ x: -1, y: 0 })
  );
  assert(
    JSON.stringify(moves[DIRECTIONS.DOWN]) === JSON.stringify({ x: 1, y: 0 })
  );
  assert(
    JSON.stringify(moves[DIRECTIONS.LEFT]) === JSON.stringify({ x: 0, y: -1 })
  );
  assert(
    JSON.stringify(moves[DIRECTIONS.RIGHT]) === JSON.stringify({ x: 0, y: 1 })
  );

  position = { x: 1, y: 1 };
  moves = possibleMoves(position);
  assert(
    JSON.stringify(moves[DIRECTIONS.UP]) === JSON.stringify({ x: 0, y: 1 })
  );
  assert(
    JSON.stringify(moves[DIRECTIONS.DOWN]) === JSON.stringify({ x: 2, y: 1 })
  );
  assert(
    JSON.stringify(moves[DIRECTIONS.LEFT]) === JSON.stringify({ x: 1, y: 0 })
  );
  assert(
    JSON.stringify(moves[DIRECTIONS.RIGHT]) === JSON.stringify({ x: 1, y: 2 })
  );

  position = { x: 0, y: 1 };
  moves = possibleMoves(position);
  assert(
    JSON.stringify(moves[DIRECTIONS.UP]) === JSON.stringify({ x: -1, y: 1 })
  );
  assert(
    JSON.stringify(moves[DIRECTIONS.DOWN]) === JSON.stringify({ x: 1, y: 1 })
  );
  assert(
    JSON.stringify(moves[DIRECTIONS.LEFT]) === JSON.stringify({ x: 0, y: 0 })
  );
  assert(
    JSON.stringify(moves[DIRECTIONS.RIGHT]) === JSON.stringify({ x: 0, y: 2 })
  );

  position = { x: 1, y: 0 };
  moves = possibleMoves(position);
  assert(
    JSON.stringify(moves[DIRECTIONS.UP]) === JSON.stringify({ x: 0, y: 0 })
  );
  assert(
    JSON.stringify(moves[DIRECTIONS.DOWN]) === JSON.stringify({ x: 2, y: 0 })
  );
  assert(
    JSON.stringify(moves[DIRECTIONS.LEFT]) === JSON.stringify({ x: 1, y: -1 })
  );
  assert(
    JSON.stringify(moves[DIRECTIONS.RIGHT]) === JSON.stringify({ x: 1, y: 1 })
  );
};

const testSamePosition = () => {
  let position1 = { x: 0, y: 1 };
  let position2 = { x: 1, y: 1 };

  assert(samePosition({ position1, position2 }) === false);
  position2 = { x: 0, y: 1 };
  assert(samePosition({ position1, position2 }) === true);
};

const testFindPosition = () => {
  // fix this func s
  let matrix = [
    ["@", "", "", "", "", "", "", "", ""],
    ["|", "", "+", "-", "C", "-", "-", "+", ""],
    ["A", "", "|", "", "", "", "", "|", ""],
    ["+", "-", "-", "-", "B", "-", "-", "+", ""],
    ["", "", "|", "", "", "", "", "", "x"],
    ["", "", "|", "", "", "", "", "", "|"],
    ["", "", "+", "-", "-", "D", "-", "-", "+"],
  ];
  assert(
    JSON.stringify(findPositions(matrix, CHARS.START)) ===
      JSON.stringify({ x: 0, y: 0 })
  );

  matrix = [
    ["1", "", "", "", "", "", "", "", ""],
    ["|", "", "+", "-", "C", "-", "-", "+", ""],
    ["A", "@", "|", "", "", "", "", "|", ""],
    ["+", "-", "-", "-", "B", "-", "-", "+", ""],
    ["", "", "|", "", "", "", "", "", "x"],
    ["", "", "|", "", "", "", "", "", "|"],
    ["", "", "+", "-", "-", "D", "-", "-", "+"],
  ];
  assert(
    JSON.stringify(findPositions(matrix, CHARS.START)) ===
      JSON.stringify({ x: 2, y: 1 })
  );

  matrix = [
    ["@", "", "", "", "", "", "", "", ""],
    ["|", "", "+", "-", "C", "-", "-", "+", ""],
    ["A", "@", "|", "", "", "", "", "|", ""],
    ["+", "-", "-", "-", "B", "-", "-", "+", ""],
    ["", "", "|", "", "", "", "", "", "x"],
    ["", "", "|", "", "", "", "", "", "|"],
    ["", "", "+", "-", "-", "D", "-", "-", "+"],
  ];

  assert(findPositions(matrix, CHARS.START) instanceof ErrorMultiplePositions);

  matrix = [
    ["", "", "", "", "", "", "", "", ""],
    ["|", "", "+", "-", "C", "-", "-", "+", ""],
    ["A", "", "|", "", "", "", "", "|", ""],
    ["+", "-", "-", "-", "B", "-", "-", "+", ""],
    ["", "", "|", "", "", "", "", "", "x"],
    ["", "", "|", "", "", "", "", "", "|"],
    ["", "", "+", "-", "-", "D", "-", "-", "+"],
  ];

  assert(findPositions(matrix, CHARS.START) instanceof ErrorNoPosition);
};

const testGetChar = () => {
  const matrix = [
    ["@", "", "", "", "", "", "", "", ""],
    ["|", "", "+", "-", "C", "-", "-", "+", ""],
    ["A", "@", "|", "", "", "", "", "|", ""],
    ["+", "-", "-", "-", "B", "-", "-", "+", ""],
    ["", "", "|", "", "", "", "", "", "x"],
    ["", "", "|", "", "", "", "", "", "|"],
    ["", "", "+", "-", "-", "D", "-", "-", "+"],
  ];

  assert(getChar(matrix, { x: 0, y: 0 } !== CHARS.START));
  assert(getChar(matrix, { x: 1, y: 0 } !== CHARS.VERTICAL));
  assert(getChar(matrix, { x: 1, y: 1 } !== ""));
};

const testGetDirectionsByCharRules = () => {
  const matrix = [
    ["@", "", "", "", "", "", "", "", ""],
    ["|", "", "+", "-", "C", "-", "-", "+", ""],
    ["A", "@", "|", "", "", "", "", "|", ""],
    ["+", "-", "-", "-", "B", "-", "-", "+", ""],
    ["", "", "|", "", "", "", "", "", "x"],
    ["", "", "|", "", "", "", "", "", "|"],
    ["", "", "+", "-", "-", "D", "-", "-", "+"],
  ];
  let position = { x: 0, y: 0 };
  let directions = getDirectionsByCharRules({
    matrix,
    position,
  }).sort();

  let realDirections = [
    DIRECTIONS.UP,
    DIRECTIONS.LEFT,
    DIRECTIONS.RIGHT,
    DIRECTIONS.DOWN,
  ].sort();

  assert(realDirections.join(",") === directions.join(","));

  position = { x: 1, y: 0 };
  directions = getDirectionsByCharRules({
    matrix,
    position,
  }).sort();

  realDirections = [DIRECTIONS.UP, DIRECTIONS.DOWN].sort();

  assert(realDirections.join(",") === directions.join(","));

  position = { x: 3, y: 1 };
  directions = getDirectionsByCharRules({
    matrix,
    position,
  }).sort();

  realDirections = [DIRECTIONS.LEFT, DIRECTIONS.RIGHT].sort();

  assert(realDirections.join(",") === directions.join(","));
};

const testRecursive = () => {
  let matrix = [
    ["@", "-", "+"],
    ["-", "+", "|"],
    ["", "x", "|"],
    ["", "+", "+"],
  ];

  let startingPosition = findPositions(matrix, CHARS.START);

  let result = recursive({ matrix, position: startingPosition });

  assert(result.letters === "");
  assert(result.path === "@-+||++x");

  matrix = [
    ["@", "", "", "", "", "", "", "", ""],
    ["|", "", "+", "-", "C", "-", "-", "+", ""],
    ["A", "", "|", "", "", "", "", "|", ""],
    ["+", "-", "-", "-", "B", "-", "-", "+", ""],
    ["", "", "|", "", "", "", "", "", "x"],
    ["", "", "|", "", "", "", "", "", "|"],
    ["", "", "+", "-", "-", "D", "-", "-", "+"],
  ];
  startingPosition = findPositions(matrix, CHARS.START);

  result = recursive({ matrix, position: startingPosition });
  assert(result.letters === "ABCD");
  assert(result.path === "@|A+---B--+|+--C-+|-||+--D--+|x");
};
const tests = () => {
  testRotateAxis();
  testPossibleMoves();
  testSamePosition();
  testFindPosition();
  testGetDirectionsByCharRules();

  testRecursive();
};

const main = () => {
  tests();

  let matrix = [
    ["@", "-", "B"],
    ["-", "+", "|"],
    ["", "x", "|"],
    ["", "+", "+"],
  ];

  // matrix = [
  //   ["@", "", "", "", "", "", "", "", ""],
  //   ["|", "", "+", "-", "C", "-", "-", "+", ""],
  //   ["A", "", "|", "", "", "", "", "|", ""],
  //   ["+", "-", "-", "-", "B", "-", "-", "+", ""],
  //   ["", "", "|", "", "", "", "", "", "x"],
  //   ["", "", "|", "", "", "", "", "", "|"],
  //   ["", "", "+", "-", "-", "D", "-", "-", "+"],
  // ];
  const startingPosition = findPositions(matrix, CHARS.START);
  if (startingPosition instanceof Error) {
    throw startingPosition;
  }
  const endingPositions = findPositions(matrix, CHARS.END);
  if (endingPositions instanceof Error) {
    throw endingPositions;
  }
  console.log(recursive({ matrix, position: startingPosition }));
};

main();
