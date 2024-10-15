# Solana Tic Tac Toe

## Deployment
### Onchain
#### Devnet
1. Change cluster provider value at Anchor.toml file to `devnet`
2. Optional
```bash
anchor clear
```

3. Build Solana program
```bash
anchor build
```

4. Deploy program to Devnet
```bash
anchor deploy
```
#### Localnet
1. Change cluster provider value at Anchor.toml file to `localnet`
2. Optional
```bash
anchor clear
```

3. Build Solana program
```bash
anchor build
```
4. Spin up test validator
``` bash
solana-test-validator
```
5. Deploy program to Devnet
```bash
anchor deploy
```

#### Redeploy to a Different Address
In order to redeploy to a different address make sure that: 
1. Generate new keypair using 
```bash
solana-keygen new --outfile target/deploy/tic_tac_toe-keypair.json
```

2. Parse public key to get `<NEW ADDRESS>`
```bash
solana address -k target/deploy/tic_tac_toe-keypair.json
```

3. Update `src/lib.rs ` program id using marcro `declare_id!(<NEW ADDRESS>)`

4. Ensure that at Anchor.toml `[programs.localnet] tic_tac_toe =` is set to `<NEW ADDRESS>`

### Frontend
To deploy frontend app ,push to master branch, than frontend Github actions is triggered.

Before Github action trigger activation, ensure that:
1. At `src/main.tsx` Buffer is imported (needed at deployment, **however should be removed at development**)
```bash
import { Buffer } from 'buffer';

window.Buffer = Buffer;
```
2. New Solana program address is updated at:
    a. `src/anchor/idl.ts`
    b.`src/anchor/setup.ts`

3. Run
```bash
yarn build
```
4. (Optional) preview production version locally be running
```bash
yarn preview
```
5. Push to master directly or via a Pull Request (suggested)

## How to Test
1. Shut down test validator
``` bash
solana-test-validator
```
2. Follow instructions for [Onchain deployment](#Localnet)

3. Ensure that at Anchor.toml `[programs.localnet]
tic_tac_toe =` is set to 

``` bash
solana address -k target/deploy/tic_tac_toe-keypair.json
```

4. Generate new type, from new IDL.
``` bash
anchor idl type --out target/types/tic_tac_toe.ts target/idl/tic_tac_toe.json
```

5. Test
```bash
anchor test
```

