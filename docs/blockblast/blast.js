const $ = (sel, el=document) => el.querySelector(sel);

const gameContainer = $('#game');
const newBlockContainer = $("#new-blocks");

const blocks = [
    [
        [1, 0, 0],
        [1, 0, 0],
        [1, 1, 1]
    ],
    [
        [0, 0, 1],
        [0, 0, 1],
        [1, 1, 1]
    ],
    [
        [1, 1, 1],
        [1, 0, 0],
        [1, 0, 0]
    ],
    [
        [1, 1, 1],
        [0, 0, 1],
        [0, 0, 1]
    ],
    [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1]
    ],
    [
        [1, 1, 0],
        [1, 1, 0],
        [0, 0, 0]
    ],
    [
        [1, 1, 1],
        [1, 1, 1],
        [0, 0, 0]
    ],
    [
        [1, 1, 0],
        [1, 1, 0],
        [1, 1, 0]
    ]
];

function make(type, parent, options) {
    const el = document.createElement(type, {
        
    });

    for(const [k, v] of Object.entries(options)) {
        el.setAttribute(k, v);
    }

    parent.appendChild(el);
    
    return el;
}

class Game {
    static newBlocks = [];
    static grid = [];

    static pickNewBlocks() {
        this.newBlocks = [];
        for (let i = 0; i < 3; i++) {
            const chosenBlock = blocks[Math.floor(Math.random() * blocks.length)];
            this.newBlocks.push(chosenBlock);
            const block = make('div', newBlockContainer, {
                class: "gridpiece",
            });

            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if(chosenBlock[i][j]) {
                        block
                    }
                }
            }
        }
    }

    static newGame() {
        this.pickNewBlocks();
        this.grid = [];
    }
}

//! todo: implement localstorage game saving

Game.newGame();