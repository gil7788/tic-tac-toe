import { Idl } from '@coral-xyz/anchor';

export type TicTacToe = Idl & {
  address: string;
  metadata: {
    name: string;
    version: string;
    spec: string;
    description: string;
  };
};

export const IDL: TicTacToe = {
  address: "3kAj48dR3U8fbfsi14FDhFfuC4otHZrGoqvUFNpi5PAR",
  metadata: {
    name: "tic_tac_toe",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Created with Anchor"
  },
  version: "0.1.0",
  name: "tic_tac_toe",
  instructions: [
    {
      name: "createGame",
      accounts: [
        {
          name: "game",
          isMut: true,
          isSigner: true
        },
        {
          name: "playerOne",
          isMut: true,
          isSigner: true
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: "joinGame",
      accounts: [
        {
          name: "game",
          isMut: true,
          isSigner: false
        },
        {
          name: "playerTwo",
          isMut: true,
          isSigner: true
        }
      ],
      args: []
    },
    {
      name: "play",
      accounts: [
        {
          name: "game",
          isMut: true,
          isSigner: false
        },
        {
          name: "player",
          isMut: false,
          isSigner: true
        }
      ],
      args: [
        {
          name: "tile",
          type: {
            defined: "Tile"
          }
        }
      ]
    }
  ],
  accounts: [
    {
      name: "game",
      type: {
        kind: "struct",
        fields: [
          {
            name: "players",
            type: {
              array: ["publicKey", 2]
            }
          },
          {
            name: "turn",
            type: "u8"
          },
          {
            name: "board",
            type: {
              array: [
                {
                  array: [
                    {
                      option: {
                        defined: "Sign"
                      }
                    },
                    3
                  ]
                },
                3
              ]
            }
          },
          {
            name: "state",
            type: { defined: "GameState" }
          }
        ]
      }
    }
  ],
  types: [
    {
      name: "Tile",
      type: {
        kind: "struct",
        fields: [
          {
            name: "row",
            type: "u8"
          },
          {
            name: "column",
            type: "u8"
          }
        ]
      }
    },
    {
      name: "Sign",
      type: {
        kind: "enum",
        variants: [
          { name: "X" },
          { name: "O" }
        ]
      }
    },
    {
      name: "GameState",
      type: {
        kind: "enum",
        variants: [
          { name: "Pending" },
          { name: "Active" },
          { name: "Tie" },
          {
            name: "Won",
            fields: [
              { name: "winner", type: "publicKey" }
            ]
          },
          { name: "Cancelled" }
        ]
      }
    }
  ],
  errors: [
    { code: 6000, name: "tileOutOfBounds" },
    { code: 6001, name: "tileAlreadySet" },
    { code: 6002, name: "gameAlreadyOver" },
    { code: 6003, name: "notPlayersTurn" },
    { code: 6004, name: "gameAlreadyStarted" },
    { code: 6005, name: "invalidState" }
  ]
};
