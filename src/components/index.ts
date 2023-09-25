import Phaser from 'phaser';
import map from '../assets/allSprites_default.png';
import mapJson from '../assets/map.json';
import playerPNG from '../assets/soldier.png';
import playerRedPNG from '../assets/soldierred.png';
import playerYellowPNG from '../assets/soldieryellow.png';
import playerBluePNG from '../assets/soldierblue.png';
import bullet from '../assets/bulletDark3_outline.png';
import explosion from '../assets/explosion4.png';

import box from '../assets/crateWood.png';
type PlayerStat = {
  remainingShots: number;
  canShoot: boolean;
};

type Control = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  shoot: Phaser.Input.Keyboard.Key;
};

export class GameScene extends Phaser.Scene {
  private players: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] = [];
  private bullets: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] = [];
  private playerKeys: Control[] = [];
  private playerStates: PlayerStat[] = [];
  private ammoGroup!: Phaser.Physics.Arcade.Group;
  private AMMO_RESPAWN_TIME = 10000;
  private player1AmmoText!: Phaser.GameObjects.Text;
  private player2AmmoText!: Phaser.GameObjects.Text;
  private player3AmmoText!: Phaser.GameObjects.Text;
  private player4AmmoText!: Phaser.GameObjects.Text;
  constructor() {
    super('GameScene');
  }
  preload() {
    this.load.image('tiles', map.src);
    this.load.tilemapTiledJSON('map', mapJson);
    this.load.spritesheet('player1', playerPNG.src, {
      frameWidth: 256,
      frameHeight: 256,
    });
    this.load.spritesheet('player2', playerRedPNG.src, {
      frameWidth: 256,
      frameHeight: 256,
    });
    this.load.spritesheet('player3', playerYellowPNG.src, {
      frameWidth: 256,
      frameHeight: 256,
    });
    this.load.spritesheet('player4', playerBluePNG.src, {
      frameWidth: 256,
      frameHeight: 256,
    });
    this.load.image('bullet', bullet.src);
    this.load.image('ammo', box.src);
    this.load.image('explosion', explosion.src);
  }

  create() {
    const map = this.make.tilemap({ key: 'map' })!;
    const tileset = map.addTilesetImage('allSprites_default', 'tiles')!;
    const ground = map.createLayer('ground', tileset!, 0, 0)!;
    const objectCollider = map.createLayer('objectCollider', tileset!, 0, 0)!;

    objectCollider?.setCollisionByProperty({ collider: true });
    ground?.setCollisionByProperty({ collider: true });
    let controls: Control[] = [];
    if (this.input.keyboard) {
      controls = [
        {
          up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP), // W para cima
          down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN), // S para baixo
          left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT), // A para esquerda
          right: this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.RIGHT
          ), // D para direita
          shoot: this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SHIFT
          ), // Espaço para atirar
        },
        {
          up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W), // W para cima
          down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S), // S para baixo
          left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A), // A para esquerda
          right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D), // D para direita
          shoot: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ALT), // Shift para atirar
        },
        {
          up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I), // W para cima
          down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K), // S para baixo
          left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J), // A para esquerda
          right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L), // D para direita
          shoot: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O), // Shift para atirar
        },
        {
          up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T), // W para cima
          down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.G), // S para baixo
          left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F), // A para esquerda
          right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H), // D para direita
          shoot: this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
          ), // Shift para atirar
        },
      ];
    }
    for (let i = 1; i <= 4; i++) {
      const spawnPoint = map.findObject(
        'player' + i,
        (objects) => objects.name === 'spawn' + i
      );
      if (!spawnPoint) {
        continue;
      }
      const player = this.physics.add.sprite(
        spawnPoint.x || 0,
        spawnPoint.y || 0,
        'player' + i
      );

      player.setCollideWorldBounds(true);
      player.setScale(0.25);
      this.physics.add.collider(player, objectCollider);
      this.physics.add.collider(player, ground);

      const animate = this.anims;

      animate.create({
        key: 'move' + i,
        frames: animate.generateFrameNames('player' + i, { start: 2, end: 3 }),
        frameRate: 5,
        repeat: -1,
      });

      animate.create({
        key: 'shoot' + i,
        frames: animate.generateFrameNames('player' + i, { start: 1, end: 1 }),
        frameRate: 30,
        repeat: 0,
      });
      const playerState = {
        remainingShots: 2,
        canShoot: true,
      };
      this.playerStates.push(playerState);
      this.players.push(player);
      this.playerKeys.push(controls[i - 1]);
    }
    this.physics.add.overlap(
      this.bullets,
      this.players,
      this.bulletHitPlayer,
      undefined,
      this
    );
    this.ammoGroup = this.physics.add.group();

    this.physics.add.collider(
      this.players,
      this.ammoGroup,
      this.playerCollectAmmo,
      undefined,
      this
    );
    this.generateRandomAmmo();
    // this.physics.add.image(
    //   this.game.config.width / 2,
    //   this.game.config.height / 2,
    //   'ammo'
    // );

    this.player1AmmoText = this.add.text(3, 3, 'Jogador 1: 0 munições', {
      font: '16px Arial',
      color: '#ffffff',
    });

    // Texto para a contagem de munições do jogador 2 no canto superior direito
    this.player2AmmoText = this.add.text(
      Number(this.game.config.width) - 3,
      3,
      'Jogador 2: 0 munições',
      {
        font: '16px Arial',
        color: '#ffffff',
        align: 'right',
      }
    );
    this.player2AmmoText.setOrigin(1, 0);

    // Texto para a contagem de munições do jogador 3 no canto inferior esquerdo
    this.player3AmmoText = this.add.text(
      3,
      Number(this.game.config.height) - 3,
      'Jogador 3: 0 munições',
      {
        font: '16px Arial',
        color: '#ffffff',
      }
    );
    this.player3AmmoText.setOrigin(0, 1);

    // Texto para a contagem de munições do jogador 4 no canto inferior direito
    this.player4AmmoText = this.add.text(
      Number(this.game.config.width) - 3,
      Number(this.game.config.height) - 3,
      'Jogador 4: 0 munições',
      {
        font: '16px Arial',
        color: '#ffffff',
        align: 'right',
      }
    );
    this.player4AmmoText.setOrigin(1, 1);
  }

  playerCollectAmmo(player: any, ammo: any) {
    ammo.destroy();

    // Aumente a contagem de munição do jogador em 2
    const playerIndex = this.players.indexOf(player);
    if (playerIndex !== -1) {
      this.playerStates[playerIndex].remainingShots += 2;
    }

    setTimeout(this.generateRandomAmmo.bind(this), this.AMMO_RESPAWN_TIME);
  }

  generateRandomAmmo() {
    const x = Phaser.Math.Between(20, 630); // Posição X aleatória
    const y = Phaser.Math.Between(20, 630); // Posição Y aleatória

    const ammo = this.physics.add.image(x, y, 'ammo');

    // Configure a colisão com os jogadores
    this.physics.add.overlap(
      this.players,
      ammo,
      this.playerCollectAmmo,
      undefined,
      this
    );

    this.time.delayedCall(
      this.AMMO_RESPAWN_TIME,
      this.generateRandomAmmo,
      [],
      this
    );
  }

  bulletHitPlayer(bullet: any, player: any) {
    // Encontre o índice do jogador atingido
    const playerIndex = this.players.indexOf(player);

    // Se o jogador não foi encontrado (índice -1), saia da função
    if (playerIndex === -1 || bullet.playerIndex === playerIndex) {
      return;
    }

    player.destroy();
    this.onBulletHit(bullet);
    // Atualize os arrays para refletir a remoção do jogador
    this.players.splice(playerIndex, 1);
    this.playerKeys.splice(playerIndex, 1);
    this.playerStates.splice(playerIndex, 1);

    const explosion = this.physics.add.sprite(player.x, player.y, 'explosion');
    bullet.destroy();
    explosion.setScale(0.5);
    this.time.delayedCall(200, () => {
      explosion.destroy();
    });
    // Verifique se o jogo acabou (por exemplo, se todos os jogadores foram derrotados)
    if (this.players.length === 0) {
      // Implemente sua lógica de final de jogo aqui
      console.log('Jogo acabou! Todos os jogadores foram derrotados.');
    }
  }

  shootBullet(player: any, playerState: PlayerStat) {
    const playerIndex = this.players.indexOf(player);
    if (playerState.remainingShots <= 0) {
      return; // Não dispare se não houver mais munições
    }
    if (playerState.canShoot === false) {
      return; // Não dispare se o jogador não puder atirar novamente ainda
    }
    let direction;
    let bulletDirectionX;
    let bulletDirectionY;
    if (player.body.rotation == 180) {
      direction = 'up';
      bulletDirectionX = player.x + 5;
      bulletDirectionY = player.y - 20;
    } else if (player.body.rotation == 0) {
      bulletDirectionX = player.x - 5;
      bulletDirectionY = player.y + 20;
      direction = 'down';
    } else if (player.body.rotation == 90) {
      direction = 'left';
      bulletDirectionX = player.x - 20;
      bulletDirectionY = player.y - 5;
    } else if (player.body.rotation == -90) {
      direction = 'right';
      bulletDirectionX = player.x + 20;
      bulletDirectionY = player.y + 5;
    }

    // Crie uma bala para o jogador
    const bullet = this.physics.add.sprite(
      bulletDirectionX || 0,
      bulletDirectionY || 0,
      'bullet'
    ) as any;
    bullet.setScale(0.3);
    player.anims.play('shoot' + Number(playerIndex + 1), true);
    this.bullets.push(bullet);

    const speed = 600;

    if (direction === 'up') {
      bullet.setVelocity(0, -speed);
      bullet.setRotation(0);
    } else if (direction === 'down') {
      bullet.setRotation(Math.PI);
      bullet.setVelocity(0, speed);
    } else if (direction === 'left') {
      bullet.setVelocity(-speed, 0);
      bullet.setRotation(-Math.PI / 2);
    } else if (direction === 'right') {
      bullet.setRotation(Math.PI / 2);
      bullet.setVelocity(speed, 0);
    }

    bullet.playerIndex = playerIndex;
    // Destrua a bala após algum tempo ou quando ela sair da tela

    playerState.remainingShots--;
    playerState.canShoot = false;
    setTimeout(() => {
      playerState.canShoot = true;
      // Permita apenas 1 tiro por vez
    }, 500);
    this.time.delayedCall(5000, () => {
      bullet.destroy();
    });
  }

  onBulletHit(bullet: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
    this.time.delayedCall(1000, () => {
      bullet.destroy();
    });
  }

  update() {
    this.player1AmmoText.setText(
      `Jogador 1: ${this.playerStates[0]?.remainingShots || 0} munições`
    );
    this.player2AmmoText.setText(
      `Jogador 2: ${this.playerStates[1]?.remainingShots || 0} munições`
    );
    this.player3AmmoText.setText(
      `Jogador 3: ${this.playerStates[2]?.remainingShots || 0} munições`
    );
    this.player4AmmoText.setText(
      `Jogador 4: ${this.playerStates[3]?.remainingShots || 0} munições`
    );

    this.players.forEach((player, index) => {
      const controls = this.playerKeys[index];
      const playerState = this.playerStates[index];

      player.body.setVelocity(0);
      if (controls?.left.isDown) {
        player.setRotation(Math.PI / 2);
        player.anims.play('move' + Number(Number(index) + 1), true);
        player.body.setVelocityX(-100);
      } else if (controls?.right.isDown) {
        player.setRotation(-Math.PI / 2);
        player.body.setVelocityX(100);
        player.anims.play('move' + Number(Number(index) + 1), true);
      } else if (controls?.down.isDown) {
        player.body.setVelocityY(100);
        player.setRotation(0);
        player.anims.play('move' + Number(Number(index) + 1), true);
      } else if (controls?.up.isDown) {
        player.setRotation(Math.PI);
        player.anims.play('move' + Number(Number(index) + 1), true);
        player.body.setVelocityY(-100);
      } else {
        player.anims.stop();
      }

      // Atire quando a tecla de tiro for pressionada
      if (controls?.shoot.isDown) {
        this.shootBullet(player, playerState);
      }
    });
  }
}
