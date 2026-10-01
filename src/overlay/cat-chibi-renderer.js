// Fluffy Chibi Kitten Renderer matching user reference image
// Features: Soft fluffy cheeks, big glossy anime eyes, puffy tail, bold clean dark line art, ZERO semi-transparent black shadows

class ChibiCatRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.width = canvas.width;
    this.height = canvas.height;

    // Customization
    this.fur = 'cream';         // 'cream' (default from image) | 'ginger' | 'tuxedo' | 'calico' | 'white'
    this.accessory = 'goggles'; // 'goggles' | 'bell' | 'bow' | 'hat' | 'none'
    this.petName = 'Mochi';

    // State & Animation
    this.state = 'idle';        // 'idle' | 'walk' | 'sleep' | 'eat' | 'petted' | 'dangling'
    this.direction = 1;         // 1: facing right, -1: facing left
    this.animTime = 0;
    this.blinkTimer = 0;
    this.isBlinking = false;

    // Floating particles (hearts, Zzz, notes)
    this.particles = [];
  }

  setCustomization({ fur, accessory, name }) {
    if (fur) this.fur = fur;
    if (accessory) this.accessory = accessory;
    if (name) this.petName = name;
  }

  setState(newState, durationMs = 0) {
    this.state = newState;
    if (durationMs > 0) {
      setTimeout(() => {
        if (this.state === newState) this.state = 'idle';
      }, durationMs);
    }
  }

  triggerPet() {
    this.setState('petted', 1800);
    this.addParticle('heart');
    this.addParticle('heart');
  }

  triggerEat() {
    this.setState('eat', 2500);
    this.addParticle('sparkle');
  }

  addParticle(type) {
    this.particles.push({
      type,
      x: this.width / 2 + (Math.random() * 30 - 15),
      y: this.height / 2 - 25,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -1.2 - Math.random() * 1.0,
      life: 1.0,
      opacity: 1.0,
      scale: 0.8 + Math.random() * 0.4
    });
  }

  update(dt) {
    this.animTime += dt;

    // Blinking
    this.blinkTimer += dt;
    if (this.blinkTimer > 3.2 + Math.random() * 2.5) {
      this.isBlinking = true;
      if (this.blinkTimer > 3.45) {
        this.isBlinking = false;
        this.blinkTimer = 0;
      }
    }

    // Sleep bubbles
    if (this.state === 'sleep' && Math.random() < 0.03) {
      this.addParticle('zzz');
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt * 0.8;
      p.opacity = Math.max(0, p.life);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  getPalette() {
    switch (this.fur) {
      case 'ginger':
        return {
          main: '#f5a65b',
          shade: '#e07a34',
          chest: '#fff5ea',
          ears: '#ffb3ba',
          line: '#3a2012',
          eyes: '#16a085',
          blush: '#ff9ea8'
        };
      case 'tuxedo':
        return {
          main: '#2d3436',
          shade: '#1e272e',
          chest: '#ffffff',
          ears: '#ffb3ba',
          line: '#181b1c',
          eyes: '#f39c12',
          blush: '#ff9ea8'
        };
      case 'calico':
        return {
          main: '#fff6eb',
          shade: '#f5d6b8',
          patchDark: '#34495e',
          patchOrange: '#e67e22',
          chest: '#ffffff',
          ears: '#ffb3ba',
          line: '#2d3436',
          eyes: '#3498db',
          blush: '#ff9ea8'
        };
      case 'white':
        return {
          main: '#ffffff',
          shade: '#eef2f7',
          chest: '#ffffff',
          ears: '#ffb3ba',
          line: '#2d3436',
          eyes: '#3498db',
          blush: '#ff9ea8'
        };
      case 'cream':
      default:
        // Exact soft peach/cream from reference Image 4
        return {
          main: '#fff0df',
          shade: '#fcdcc2',
          chest: '#ffffff',
          ears: '#ffcad4',
          line: '#342a27',
          eyes: '#1b1717',
          blush: '#ffa8b6'
        };
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const palette = this.getPalette();
    const cx = this.width / 2;
    const cy = this.height / 2 + 15;

    ctx.save();

    // Flip when facing left
    if (this.direction === -1) {
      ctx.translate(this.width, 0);
      ctx.scale(-1, 1);
    }

    // Motion bobbing
    let bobY = 0;
    let pawOffset = 0;
    let tailAngle = Math.sin(this.animTime * 3) * 0.25;

    if (this.state === 'walk') {
      bobY = Math.sin(this.animTime * 10) * 3;
      pawOffset = Math.sin(this.animTime * 10) * 8;
      tailAngle = Math.sin(this.animTime * 8) * 0.45;
    } else if (this.state === 'sleep') {
      bobY = Math.sin(this.animTime * 2) * 1.5;
    } else {
      bobY = Math.sin(this.animTime * 2.5) * 1.5;
    }

    // 1. Draw Big Fluffy Puffy Tail (Curled on side behind body)
    this.drawFluffyTail(cx - 28, cy - 6 + bobY, tailAngle, palette);

    // 2. Draw Body & Paws
    if (this.state === 'sleep') {
      this.drawCurledBody(cx, cy + bobY, palette);
    } else {
      this.drawBody(cx, cy + bobY, pawOffset, palette);
      this.drawFluffyHead(cx, cy - 18 + bobY, palette);
      this.drawAccessory(cx, cy - 18 + bobY);
    }

    ctx.restore();

    // Floating particles
    this.drawParticles();
  }

  drawFluffyTail(x, y, angle, palette) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle - 0.2);

    // Large fluffy round tail like image 4
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = palette.line;
    ctx.fillStyle = palette.main;

    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 26, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Soft shading on tail
    ctx.fillStyle = palette.shade;
    ctx.beginPath();
    ctx.ellipse(-4, 4, 14, 18, 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawBody(cx, cy, pawOffset, palette) {
    const ctx = this.ctx;

    // Small chubby body
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = palette.line;
    ctx.fillStyle = palette.main;

    ctx.beginPath();
    ctx.ellipse(cx, cy + 12, 26, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Soft shaded lower body
    ctx.fillStyle = palette.shade;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 18, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fluffy chest bib (pure white)
    ctx.fillStyle = palette.chest;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 8, 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Front little paws
    this.drawLittlePaw(cx - 10 + pawOffset, cy + 24, palette);
    this.drawLittlePaw(cx + 10 - pawOffset, cy + 24, palette);
  }

  drawLittlePaw(x, y, palette) {
    const ctx = this.ctx;
    ctx.lineWidth = 3;
    ctx.strokeStyle = palette.line;
    ctx.fillStyle = palette.chest;

    ctx.beginPath();
    ctx.ellipse(x, y, 7.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  drawFluffyHead(cx, cy, palette) {
    const ctx = this.ctx;

    // 1. Ears with soft fluffy rounded tips
    this.drawEar(cx - 24, cy - 14, -0.22, palette);
    this.drawEar(cx + 24, cy - 14, 0.22, palette);

    // 2. Extra Fluffy Cheeks Head Silhouette (Matching Image 4)
    ctx.lineWidth = 4;
    ctx.strokeStyle = palette.line;
    ctx.fillStyle = palette.main;

    ctx.beginPath();
    // Top of head
    ctx.moveTo(cx - 26, cy - 16);
    ctx.quadraticCurveTo(cx, cy - 24, cx + 26, cy - 16);
    // Right cheek fluff tufts
    ctx.quadraticCurveTo(cx + 38, cy - 6, cx + 42, cy + 8);
    ctx.quadraticCurveTo(cx + 44, cy + 18, cx + 30, cy + 26);
    // Chin
    ctx.quadraticCurveTo(cx, cy + 30, cx - 30, cy + 26);
    // Left cheek fluff tufts
    ctx.quadraticCurveTo(cx - 44, cy + 18, cx - 42, cy + 8);
    ctx.quadraticCurveTo(cx - 38, cy - 6, cx - 26, cy - 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Soft pastel shading on lower cheeks
    ctx.fillStyle = palette.shade;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 18, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fluffy chest / chin fluff
    ctx.fillStyle = palette.chest;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 18, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Pink Blush Circles under eyes (Just like Image 4!)
    ctx.fillStyle = palette.blush;
    ctx.beginPath();
    ctx.ellipse(cx - 20, cy + 8, 7, 4.5, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 20, cy + 8, 7, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Big Glossy Kawaii Eyes (Just like Image 4!)
    this.drawKawaiiEyes(cx, cy + 1, palette);

    // 5. Cute Tiny Nose
    ctx.fillStyle = '#ff758f';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 5, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 6. Sweet :3 Cat Mouth
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = palette.line;
    ctx.lineCap = 'round';
    if (this.state === 'eat') {
      ctx.fillStyle = '#ff758f';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, 4, 4 + Math.sin(this.animTime * 12) * 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(cx - 3.5, cy + 8, 3.5, 0.2, Math.PI * 0.95);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 3.5, cy + 8, 3.5, 0.05, Math.PI * 0.8);
      ctx.stroke();
    }

    // 7. Whiskers (2 short lines on each cheek like Image 4)
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = palette.line;
    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.moveTo(cx + side * 22, cy + 5);
      ctx.lineTo(cx + side * 34, cy + 2);
      ctx.moveTo(cx + side * 22, cy + 10);
      ctx.lineTo(cx + side * 34, cy + 11);
      ctx.stroke();
    });
  }

  drawEar(x, y, angle, palette) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Outer ear outline
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = palette.line;
    ctx.fillStyle = palette.main;
    ctx.beginPath();
    ctx.moveTo(-11, 8);
    ctx.lineTo(0, -22);
    ctx.lineTo(13, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner soft pink ear
    ctx.fillStyle = palette.ears;
    ctx.beginPath();
    ctx.moveTo(-6, 6);
    ctx.lineTo(0, -14);
    ctx.lineTo(7, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawKawaiiEyes(cx, cy, palette) {
    const ctx = this.ctx;

    if (this.state === 'petted' || this.state === 'eat') {
      // Blissful curved eyes (^-^)
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = palette.line;
      ctx.lineCap = 'round';
      [-13, 13].forEach(ex => {
        ctx.beginPath();
        ctx.arc(cx + ex, cy, 7, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      });
      return;
    }

    if (this.isBlinking) {
      // Closed line eyes
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = palette.line;
      ctx.lineCap = 'round';
      [-13, 13].forEach(ex => {
        ctx.beginPath();
        ctx.moveTo(cx + ex - 6, cy);
        ctx.lineTo(cx + ex + 6, cy);
        ctx.stroke();
      });
      return;
    }

    // Big Glossy Round Kawaii Eyes (Image 4)
    const eyeRadius = 6.5;
    [-13, 13].forEach(ex => {
      // Obsidian black pupil/iris
      ctx.fillStyle = palette.eyes;
      ctx.beginPath();
      ctx.arc(cx + ex, cy, eyeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Big Shine Highlight (top-right)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx + ex + 2, cy - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Small secondary glint (bottom-left)
      ctx.beginPath();
      ctx.arc(cx + ex - 2, cy + 2.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawCurledBody(cx, cy, palette) {
    const ctx = this.ctx;

    // Curled round sleeping puff
    ctx.lineWidth = 4;
    ctx.strokeStyle = palette.line;
    ctx.fillStyle = palette.main;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 32, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // White belly
    ctx.fillStyle = palette.chest;
    ctx.beginPath();
    ctx.ellipse(cx - 2, cy + 3, 18, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Tucked head
    ctx.fillStyle = palette.main;
    ctx.beginPath();
    ctx.arc(cx + 14, cy - 2, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Sleeping eye
    ctx.lineWidth = 3;
    ctx.strokeStyle = palette.line;
    ctx.beginPath();
    ctx.arc(cx + 16, cy - 1, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Ear
    this.drawEar(cx + 20, cy - 16, 0.3, palette);
  }

  drawAccessory(cx, cy) {
    const ctx = this.ctx;

    if (this.accessory === 'goggles') {
      // Aviator Pilot Goggles
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = '#5d4037';
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy - 14);
      ctx.lineTo(cx + 30, cy - 14);
      ctx.stroke();

      [-12, 12].forEach(gx => {
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#d35400';
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + gx, cy - 14, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(52, 152, 219, 0.4)';
        ctx.beginPath();
        ctx.arc(cx + gx, cy - 14, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + gx - 3, cy - 17);
        ctx.lineTo(cx + gx + 3, cy - 11);
        ctx.stroke();
      });

    } else if (this.accessory === 'bell') {
      // Red Collar
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#e74c3c';
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(cx - 15, cy + 22, 30, 5, 2.5) : ctx.rect(cx - 15, cy + 22, 30, 5);
      ctx.fill();

      // Shiny Gold Bell
      ctx.fillStyle = '#f1c40f';
      ctx.strokeStyle = '#b7950b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy + 28, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

    } else if (this.accessory === 'bow') {
      // Dapper Red Bowtie
      ctx.fillStyle = '#e74c3c';
      ctx.strokeStyle = '#922b21';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(cx, cy + 24);
      ctx.lineTo(cx - 10, cy + 18);
      ctx.lineTo(cx - 10, cy + 30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, cy + 24);
      ctx.lineTo(cx + 10, cy + 18);
      ctx.lineTo(cx + 10, cy + 30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy + 24, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

    } else if (this.accessory === 'hat') {
      // Cone Hat
      ctx.fillStyle = '#9b59b6';
      ctx.strokeStyle = '#342a27';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(cx - 12, cy - 20);
      ctx.lineTo(cx + 12, cy - 20);
      ctx.lineTo(cx, cy - 50);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(cx, cy - 51, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
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
        ctx.bezierCurveTo(-7, -7, -12, 2, 0, 10);
        ctx.bezierCurveTo(12, 2, 7, -7, 0, 0);
        ctx.fill();
      } else if (p.type === 'zzz') {
        ctx.font = 'bold 18px "Segoe UI", sans-serif';
        ctx.fillStyle = '#6c5ce7';
        ctx.fillText('Z', 0, 0);
      } else if (p.type === 'sparkle') {
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }
}

window.ChibiCatRenderer = ChibiCatRenderer;
