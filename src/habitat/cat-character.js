// High-quality anime-style Cat Character with bold cartoon outlines, expressive eyes, and smooth animations

class CatCharacter {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // World position on habitat shelf
    this.x = 280;          // X position along the shelf (e.g. 50 to 550)
    this.y = 195;          // Ground baseline
    this.targetX = 280;
    this.speed = 70;       // px per second

    // State & Animation
    this.state = 'idle';   // 'idle' | 'walk' | 'eat' | 'sleep' | 'petted' | 'dangling'
    this.direction = 1;    // 1: right, -1: left
    this.animTime = 0;
    this.blinkTimer = 0;
    this.isBlinking = false;
    this.chewTimer = 0;

    // Customization
    this.fur = 'orange';       // 'orange' | 'tuxedo' | 'calico' | 'white'
    this.accessory = 'goggles'; // 'goggles' | 'bell' | 'bow' | 'hat' | 'none'
    this.petName = 'Mochi';

    // Particles (hearts, crunches, zzz)
    this.particles = [];
  }

  setCustomization({ fur, accessory, name }) {
    if (fur) this.fur = fur;
    if (accessory) this.accessory = accessory;
    if (name) this.petName = name;
  }

  moveTo(targetX, onReached = null) {
    this.targetX = Math.max(70, Math.min(540, targetX));
    this.onReached = onReached;
    if (Math.abs(this.targetX - this.x) > 6) {
      this.direction = this.targetX > this.x ? 1 : -1;
      this.state = 'walk';
    }
  }

  triggerPet() {
    this.state = 'petted';
    this.addParticle('heart');
    this.addParticle('heart');
    setTimeout(() => {
      if (this.state === 'petted') this.state = 'idle';
    }, 1800);
  }

  triggerEat() {
    this.state = 'eat';
    this.chewTimer = 0;
    for (let i = 0; i < 4; i++) {
      setTimeout(() => this.addParticle('crunch'), i * 300);
    }
    setTimeout(() => {
      if (this.state === 'eat') this.state = 'idle';
    }, 2800);
  }

  triggerSleep() {
    this.state = 'sleep';
  }

  wakeUp() {
    if (this.state === 'sleep') {
      this.state = 'idle';
    }
  }

  addParticle(type) {
    this.particles.push({
      type,
      x: this.x + (Math.random() * 30 - 15),
      y: this.y - 75 + (Math.random() * 20 - 10),
      vx: (Math.random() - 0.5) * 20,
      vy: -35 - Math.random() * 25,
      life: 1.0,
      opacity: 1.0,
      scale: 0.8 + Math.random() * 0.4
    });
  }

  update(dt) {
    this.animTime += dt;

    // Walking movement logic
    if (this.state === 'walk') {
      const dist = this.targetX - this.x;
      const step = Math.sign(dist) * Math.min(Math.abs(dist), this.speed * dt);
      this.x += step;
      this.direction = Math.sign(dist) || this.direction;

      if (Math.abs(dist) < 4) {
        this.x = this.targetX;
        this.state = 'idle';
        if (this.onReached) {
          const cb = this.onReached;
          this.onReached = null;
          cb();
        }
      }
    }

    // Blinking
    this.blinkTimer += dt;
    if (this.blinkTimer > 3.0 + Math.random() * 2.5) {
      this.isBlinking = true;
      if (this.blinkTimer > 3.25) {
        this.isBlinking = false;
        this.blinkTimer = 0;
      }
    }

    // Sleep bubbles
    if (this.state === 'sleep' && Math.random() < 0.03) {
      this.addParticle('zzz');
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 0.9;
      p.opacity = Math.max(0, p.life);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  getPalette() {
    switch (this.fur) {
      case 'tuxedo':
        return {
          main: '#22252a',
          dark: '#14161a',
          light: '#ffffff',
          belly: '#ffffff',
          eyes: '#f39c12',
          innerEar: '#ffb3ba',
          nose: '#ff758f',
          outline: '#101214'
        };
      case 'calico':
        return {
          main: '#fcf3cf',
          dark: '#2c3e50',
          light: '#e67e22',
          belly: '#ffffff',
          eyes: '#2980b9',
          innerEar: '#ffb3ba',
          nose: '#ff758f',
          outline: '#1c1917'
        };
      case 'white':
        return {
          main: '#ffffff',
          dark: '#e2e8f0',
          light: '#f8fafc',
          belly: '#ffffff',
          eyes: '#3498db',
          innerEar: '#ffb3ba',
          nose: '#ff758f',
          outline: '#1c1917'
        };
      case 'orange':
      default:
        return {
          main: '#f39c12',
          dark: '#d35400',
          light: '#fff4eb',
          belly: '#fff4eb',
          eyes: '#27ae60',
          innerEar: '#ffb3ba',
          nose: '#ff758f',
          outline: '#1a1815'
        };
    }
  }

  draw() {
    const ctx = this.ctx;
    const palette = this.getPalette();

    ctx.save();
    ctx.translate(this.x, this.y);

    // Flip horizontally when walking/facing left
    if (this.direction === -1) {
      ctx.scale(-1, 1);
    }

    // Shadow on shelf ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 38, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bobbing / Walk cycle offsets
    let bobY = 0;
    let pawCycle = 0;
    let tailWag = Math.sin(this.animTime * 3) * 0.3;

    if (this.state === 'walk') {
      bobY = Math.abs(Math.sin(this.animTime * 8)) * -5;
      pawCycle = Math.sin(this.animTime * 8) * 12;
      tailWag = Math.sin(this.animTime * 8) * 0.5;
    } else if (this.state === 'eat') {
      bobY = Math.sin(this.animTime * 10) * 3;
    } else if (this.state === 'sleep') {
      bobY = Math.sin(this.animTime * 2) * 1.5;
    }

    if (this.state === 'sleep') {
      this.drawCurledSleepingCat(palette, bobY);
    } else if (this.state === 'dangling') {
      this.drawDanglingCat(palette);
    } else {
      this.drawNormalCat(palette, bobY, pawCycle, tailWag);
    }

    ctx.restore();

    // Draw floating particles
    this.drawParticles();
  }

  drawNormalCat(palette, bobY, pawCycle, tailWag) {
    const ctx = this.ctx;

    // 1. TAIL
    ctx.save();
    ctx.translate(-24, -28 + bobY);
    ctx.rotate(-0.3 + tailWag);
    ctx.lineWidth = 12;
    ctx.strokeStyle = palette.outline;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-22, -18, -16, -42);
    ctx.stroke();

    ctx.lineWidth = 8;
    ctx.strokeStyle = palette.main;
    ctx.stroke();

    // Dark tail tip
    ctx.strokeStyle = palette.dark;
    ctx.beginPath();
    ctx.moveTo(-18, -32);
    ctx.lineTo(-16, -42);
    ctx.stroke();
    ctx.restore();

    // 2. BACK PAWS
    this.drawPaw(-16 - pawCycle * 0.5, 0, 10, palette);
    this.drawPaw(16 + pawCycle * 0.5, 0, 10, palette);

    // 3. BODY
    ctx.lineWidth = 4;
    ctx.strokeStyle = palette.outline;
    ctx.fillStyle = palette.main;

    ctx.beginPath();
    ctx.ellipse(0, -32 + bobY, 32, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Belly fluff (cream / white)
    ctx.fillStyle = palette.belly;
    ctx.beginPath();
    ctx.ellipse(0, -28 + bobY, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tiger stripes or calico spots on body
    if (this.fur === 'orange') {
      ctx.lineWidth = 3;
      ctx.strokeStyle = palette.dark;
      ctx.beginPath();
      ctx.moveTo(-28, -38 + bobY);
      ctx.lineTo(-14, -36 + bobY);
      ctx.moveTo(28, -38 + bobY);
      ctx.lineTo(14, -36 + bobY);
      ctx.stroke();
    } else if (this.fur === 'calico') {
      ctx.fillStyle = palette.dark;
      ctx.beginPath();
      ctx.arc(-16, -34 + bobY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = palette.light;
      ctx.beginPath();
      ctx.arc(14, -28 + bobY, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. FRONT PAWS
    this.drawPaw(-10 + pawCycle, 2, 9, palette);
    this.drawPaw(10 - pawCycle, 2, 9, palette);

    // 5. HEAD
    this.drawHead(palette, -68 + bobY);

    // 6. ACCESSORY
    this.drawAccessory(palette, -68 + bobY);
  }

  drawPaw(x, y, radius, palette) {
    const ctx = this.ctx;
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = palette.outline;
    ctx.fillStyle = palette.main;
    ctx.beginPath();
    ctx.ellipse(x, y - radius * 0.8, radius, radius * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // White sock tip
    ctx.fillStyle = palette.light;
    ctx.beginPath();
    ctx.arc(x, y - 2, radius * 0.7, 0, Math.PI);
    ctx.fill();
  }

  drawHead(palette, headY) {
    const ctx = this.ctx;

    // Ears with bold outlines
    this.drawEar(-22, headY - 14, -0.25, palette);
    this.drawEar(22, headY - 14, 0.25, palette);

    // Main Head Oval
    ctx.lineWidth = 4;
    ctx.strokeStyle = palette.outline;
    ctx.fillStyle = palette.main;
    ctx.beginPath();
    ctx.ellipse(0, headY, 34, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Calico or Orange forehead markings
    if (this.fur === 'orange') {
      ctx.lineWidth = 3;
      ctx.strokeStyle = palette.dark;
      ctx.beginPath();
      ctx.moveTo(-6, headY - 24);
      ctx.lineTo(-4, headY - 14);
      ctx.moveTo(0, headY - 26);
      ctx.lineTo(0, headY - 13);
      ctx.moveTo(6, headY - 24);
      ctx.lineTo(4, headY - 14);
      ctx.stroke();
    } else if (this.fur === 'calico') {
      ctx.fillStyle = palette.dark;
      ctx.beginPath();
      ctx.arc(-16, headY - 12, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cheeks & Snout
    ctx.fillStyle = palette.light;
    ctx.beginPath();
    ctx.ellipse(-8, headY + 10, 10, 8, -0.2, 0, Math.PI * 2);
    ctx.ellipse(8, headY + 10, 10, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Pink Cheeks (Blush)
    ctx.fillStyle = 'rgba(255, 117, 143, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-20, headY + 8, 7, 4.5, 0, 0, Math.PI * 2);
    ctx.ellipse(20, headY + 8, 7, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    this.drawEyes(palette, headY);

    // Cute Nose
    ctx.fillStyle = palette.nose;
    ctx.beginPath();
    ctx.moveTo(-3.5, headY + 6);
    ctx.lineTo(3.5, headY + 6);
    ctx.lineTo(0, headY + 10);
    ctx.closePath();
    ctx.fill();

    // Mouth (:3 or eating chomp)
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = palette.outline;
    if (this.state === 'eat') {
      ctx.fillStyle = '#ff758f';
      ctx.beginPath();
      ctx.ellipse(0, headY + 13, 5, 5 + Math.sin(this.animTime * 12) * 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-4, headY + 11, 4, 0.2, Math.PI * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(4, headY + 11, 4, 0.1, Math.PI * 0.8);
      ctx.stroke();
    }

    // Whiskers
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(30, 30, 30, 0.7)';
    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.moveTo(side * 18, headY + 9);
      ctx.lineTo(side * 38, headY + 5);
      ctx.moveTo(side * 18, headY + 13);
      ctx.lineTo(side * 36, headY + 17);
      ctx.stroke();
    });
  }

  drawEar(x, y, angle, palette) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Outer ear with outline
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = palette.outline;
    ctx.fillStyle = palette.main;
    ctx.beginPath();
    ctx.moveTo(-12, 10);
    ctx.lineTo(0, -26);
    ctx.lineTo(14, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner pink ear
    ctx.fillStyle = palette.innerEar;
    ctx.beginPath();
    ctx.moveTo(-7, 8);
    ctx.lineTo(0, -18);
    ctx.lineTo(8, 7);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawEyes(palette, headY) {
    const ctx = this.ctx;

    if (this.state === 'petted' || this.state === 'eat') {
      // Blissful curved closed eyes (^-^)
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = palette.outline;
      [-13, 13].forEach(ex => {
        ctx.beginPath();
        ctx.arc(ex, headY + 1, 8, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      });
      return;
    }

    if (this.isBlinking) {
      // Blinking lines (- -)
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = palette.outline;
      [-13, 13].forEach(ex => {
        ctx.beginPath();
        ctx.moveTo(ex - 7, headY + 1);
        ctx.lineTo(ex + 7, headY + 1);
        ctx.stroke();
      });
      return;
    }

    // Big Anime Eyes with Highlights (Just like reference image!)
    const r = 9;
    [-13, 13].forEach(ex => {
      // White sclera backing
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(ex, headY, r, r * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Colored Iris
      ctx.fillStyle = palette.eyes;
      ctx.beginPath();
      ctx.ellipse(ex, headY + 1, r * 0.85, r * 1.05, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dark Pupil
      ctx.fillStyle = '#111317';
      ctx.beginPath();
      ctx.ellipse(ex, headY + 1.5, r * 0.55, r * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bold Eye Outline
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = palette.outline;
      ctx.beginPath();
      ctx.ellipse(ex, headY, r, r * 1.15, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Big Shine Highlight (top-left)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - 3, headY - 3, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Small secondary highlight (bottom-right)
      ctx.beginPath();
      ctx.arc(ex + 3, headY + 3, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawAccessory(palette, headY) {
    const ctx = this.ctx;

    if (this.accessory === 'goggles') {
      // Aviator Pilot Goggles (Inspired by Patamon in user screenshot!)
      // Strap around head
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#5d4037';
      ctx.beginPath();
      ctx.moveTo(-32, headY - 14);
      ctx.lineTo(32, headY - 14);
      ctx.stroke();

      // Goggle lenses
      [-13, 13].forEach(gx => {
        // Leather/Bronze rim
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#d35400';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(gx, headY - 14, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Blue tinted glass
        ctx.fillStyle = 'rgba(52, 152, 219, 0.4)';
        ctx.beginPath();
        ctx.arc(gx, headY - 14, 8, 0, Math.PI * 2);
        ctx.fill();

        // Glass reflection glare
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gx - 4, headY - 18);
        ctx.lineTo(gx + 4, headY - 10);
        ctx.stroke();
      });

      // Bridge connection
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#d35400';
      ctx.beginPath();
      ctx.moveTo(-3, headY - 14);
      ctx.lineTo(3, headY - 14);
      ctx.stroke();

    } else if (this.accessory === 'bell') {
      // Red Collar
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#e74c3c';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-16, headY + 23, 32, 6, 3) : ctx.rect(-16, headY + 23, 32, 6);
      ctx.fillStyle = '#e74c3c';
      ctx.fill();

      // Shiny Gold Bell
      ctx.fillStyle = '#f1c40f';
      ctx.strokeStyle = '#b7950b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, headY + 30, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Bell slit
      ctx.fillStyle = '#7d6608';
      ctx.beginPath();
      ctx.arc(0, headY + 31, 2, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.accessory === 'bow') {
      // Dapper Crimson Bowtie
      ctx.fillStyle = '#e74c3c';
      ctx.strokeStyle = '#922b21';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(0, headY + 26);
      ctx.lineTo(-12, headY + 20);
      ctx.lineTo(-12, headY + 32);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, headY + 26);
      ctx.lineTo(12, headY + 20);
      ctx.lineTo(12, headY + 32);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Center Knot
      ctx.beginPath();
      ctx.arc(0, headY + 26, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

    } else if (this.accessory === 'hat') {
      // Festive Wizard / Party Hat
      ctx.fillStyle = '#8e44ad';
      ctx.strokeStyle = palette.outline;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(-14, headY - 24);
      ctx.lineTo(14, headY - 24);
      ctx.lineTo(0, headY - 58);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Golden Star on tip
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(0, headY - 59, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawCurledSleepingCat(palette, bobY) {
    const ctx = this.ctx;

    // Curled body ball
    ctx.lineWidth = 4;
    ctx.strokeStyle = palette.outline;
    ctx.fillStyle = palette.main;
    ctx.beginPath();
    ctx.ellipse(0, -18 + bobY, 36, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Belly curl
    ctx.fillStyle = palette.belly;
    ctx.beginPath();
    ctx.ellipse(-4, -14 + bobY, 20, 15, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Tucked head
    ctx.fillStyle = palette.main;
    ctx.beginPath();
    ctx.arc(16, -18 + bobY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Sleeping crescent eye
    ctx.lineWidth = 3;
    ctx.strokeStyle = palette.outline;
    ctx.beginPath();
    ctx.arc(18, -16 + bobY, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Ear
    this.drawEar(24, -28 + bobY, 0.3, palette);

    // Tail wrapping around
    ctx.lineWidth = 10;
    ctx.strokeStyle = palette.outline;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -14 + bobY, 34, 1.2, 3.2);
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.strokeStyle = palette.dark;
    ctx.stroke();
  }

  drawDanglingCat(palette) {
    const ctx = this.ctx;
    // Surprised wide eyes (picked up by cursor)
    this.drawNormalCat(palette, 0, 0, 0);
  }

  drawParticles() {
    const ctx = this.ctx;
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.scale(p.scale, p.scale);

      if (p.type === 'heart') {
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-8, -8, -14, 2, 0, 12);
        ctx.bezierCurveTo(14, 2, 8, -8, 0, 0);
        ctx.fill();
      } else if (p.type === 'zzz') {
        ctx.font = 'bold 20px "Segoe UI", sans-serif';
        ctx.fillStyle = '#6c5ce7';
        ctx.fillText('Z', 0, 0);
      } else if (p.type === 'crunch') {
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }
}

window.CatCharacter = CatCharacter;
