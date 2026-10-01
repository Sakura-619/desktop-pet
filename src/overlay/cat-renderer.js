// Canvas 2D Animated Cat Renderer with dynamic customization and state animations

class CatRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.width = canvas.width;
    this.height = canvas.height;

    // Customization
    this.fur = 'orange';        // orange | tuxedo | calico | white
    this.accessory = 'bell';    // bell | bow | hat | none
    this.petName = 'Mochi';

    // Animation & State
    this.state = 'idle';        // idle | walk | sleep | meow | petted | mischief
    this.direction = 1;         // 1: right, -1: left
    this.animTime = 0;
    this.blinkTimer = 0;
    this.isBlinking = false;
    this.meowTimer = 0;
    this.pettedTimer = 0;

    // Particle systems
    this.particles = [];        // hearts, zzz, notes
  }

  setCustomization(customization) {
    if (customization.fur) this.fur = customization.fur;
    if (customization.accessory) this.accessory = customization.accessory;
    if (customization.name) this.petName = customization.name;
  }

  setState(newState, durationMs = 0) {
    this.state = newState;
    if (durationMs > 0) {
      setTimeout(() => {
        if (this.state === newState) {
          this.state = 'idle';
        }
      }, durationMs);
    }
  }

  triggerMeow() {
    this.setState('meow', 1400);
    this.meowTimer = 1.4;
    this.addParticle('note');
    if (window.CatAudio) window.CatAudio.playMeow();
  }

  triggerPet() {
    this.setState('petted', 1800);
    this.pettedTimer = 1.8;
    this.addParticle('heart');
    this.addParticle('heart');
    if (window.CatAudio) {
      window.CatAudio.playPurr();
      window.CatAudio.playBoop();
    }
  }

  triggerSnack() {
    this.setState('idle');
    this.addParticle('sparkle');
    if (window.CatAudio) window.CatAudio.playEat();
  }

  addParticle(type) {
    const p = {
      type,
      x: this.width / 2 + (Math.random() * 40 - 20),
      y: this.height / 2 - 20,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -1.2 - Math.random() * 1.2,
      opacity: 1.0,
      life: 1.0,
      scale: 0.8 + Math.random() * 0.4
    };
    this.particles.push(p);
  }

  update(dt) {
    this.animTime += dt;

    // Blinking logic
    this.blinkTimer += dt;
    if (this.blinkTimer > 3.5 + Math.random() * 2) {
      this.isBlinking = true;
      if (this.blinkTimer > 3.7) {
        this.isBlinking = false;
        this.blinkTimer = 0;
      }
    }

    // Sleep Zzz particles
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
      case 'tuxedo':
        return {
          main: '#1e2229',
          dark: '#121418',
          secondary: '#ffffff',
          snout: '#ffffff',
          innerEar: '#ffb6c1',
          eyes: '#2ecc71',
          blush: 'rgba(255, 182, 193, 0.4)'
        };
      case 'calico':
        return {
          main: '#fff9f2',
          dark: '#2c3e50',
          secondary: '#e67e22',
          snout: '#fff9f2',
          innerEar: '#ffb6c1',
          eyes: '#3498db',
          blush: 'rgba(255, 150, 160, 0.4)'
        };
      case 'white':
        return {
          main: '#ffffff',
          dark: '#e2e8f0',
          secondary: '#f8fafc',
          snout: '#ffffff',
          innerEar: '#ffb6c1',
          eyes: '#3498db',
          blush: 'rgba(255, 160, 175, 0.45)'
        };
      case 'orange':
      default:
        return {
          main: '#ff9d42',
          dark: '#d66211',
          secondary: '#fff4eb',
          snout: '#fff4eb',
          innerEar: '#ffb6c1',
          eyes: '#27ae60',
          blush: 'rgba(230, 100, 100, 0.35)'
        };
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const palette = this.getPalette();
    const cx = this.width / 2;
    const cy = this.height / 2 + 10;

    ctx.save();

    // Mirror if facing left
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
      tailAngle = Math.sin(this.animTime * 8) * 0.4;
    } else if (this.state === 'sleep') {
      bobY = Math.sin(this.animTime * 1.5) * 1.5;
    } else {
      bobY = Math.sin(this.animTime * 2.5) * 1.5;
    }

    // Draw Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 38, 38, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw Tail
    this.drawTail(cx - 26, cy + 18 + bobY, tailAngle, palette);

    // Draw Body
    if (this.state === 'sleep') {
      this.drawCurledBody(cx, cy + 12 + bobY, palette);
    } else {
      this.drawNormalBody(cx, cy + bobY, pawOffset, palette);
      this.drawHead(cx, cy - 16 + bobY, palette);
      this.drawAccessory(cx, cy - 16 + bobY);
    }

    ctx.restore();

    // Draw floating particles
    this.drawParticles();
  }

  drawTail(x, y, angle, palette) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle - 0.4);

    ctx.strokeStyle = palette.main;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-22, -18, -14, -38);
    ctx.stroke();

    // Dark tail tip or stripes
    ctx.strokeStyle = palette.dark;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-18, -28);
    ctx.lineTo(-14, -38);
    ctx.stroke();

    ctx.restore();
  }

  drawNormalBody(cx, cy, pawOffset, palette) {
    const ctx = this.ctx;

    // Back Paws
    ctx.fillStyle = palette.main;
    ctx.beginPath();
    ctx.ellipse(cx - 16 - pawOffset * 0.4, cy + 32, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 16 + pawOffset * 0.4, cy + 32, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main Torso
    ctx.fillStyle = palette.main;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 14, 28, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Calico or Tuxedo patches on body
    if (this.fur === 'calico') {
      ctx.fillStyle = palette.dark;
      ctx.beginPath();
      ctx.arc(cx - 14, cy + 10, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = palette.secondary;
      ctx.beginPath();
      ctx.arc(cx + 12, cy + 16, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.fur === 'orange') {
      // Tiger stripes
      ctx.strokeStyle = palette.dark;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 24, cy + 8);
      ctx.lineTo(cx - 12, cy + 10);
      ctx.moveTo(cx + 24, cy + 8);
      ctx.lineTo(cx + 12, cy + 10);
      ctx.stroke();
    }

    // Belly patch (White bib)
    ctx.fillStyle = palette.secondary;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 18, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Front Paws
    ctx.fillStyle = palette.main;
    ctx.beginPath();
    ctx.ellipse(cx - 10 + pawOffset, cy + 34, 8, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 10 - pawOffset, cy + 34, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // White socks on paws
    ctx.fillStyle = palette.secondary;
    ctx.beginPath();
    ctx.arc(cx - 10 + pawOffset, cy + 36, 6, 0, Math.PI);
    ctx.arc(cx + 10 - pawOffset, cy + 36, 6, 0, Math.PI);
    ctx.fill();
  }

  drawCurledBody(cx, cy, palette) {
    const ctx = this.ctx;

    // Curled ball body
    ctx.fillStyle = palette.main;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 34, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // White belly curl
    ctx.fillStyle = palette.secondary;
    ctx.beginPath();
    ctx.ellipse(cx - 4, cy + 4, 18, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Head tucked in
    ctx.fillStyle = palette.main;
    ctx.beginPath();
    ctx.arc(cx + 14, cy - 2, 18, 0, Math.PI * 2);
    ctx.fill();

    // Sleeping closed eyes (crescent)
    ctx.strokeStyle = '#4a3b32';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx + 16, cy - 1, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Ears
    ctx.fillStyle = palette.main;
    ctx.beginPath();
    ctx.moveTo(cx + 20, cy - 16);
    ctx.lineTo(cx + 30, cy - 26);
    ctx.lineTo(cx + 32, cy - 12);
    ctx.fill();

    // Tail wrapping around
    ctx.strokeStyle = palette.dark;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 1.2, 3.2);
    ctx.stroke();
  }

  drawHead(cx, cy, palette) {
    const ctx = this.ctx;

    // Ears
    // Left ear
    ctx.fillStyle = palette.main;
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy - 10);
    ctx.lineTo(cx - 30, cy - 36);
    ctx.lineTo(cx - 10, cy - 22);
    ctx.closePath();
    ctx.fill();

    // Left inner ear
    ctx.fillStyle = palette.innerEar;
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy - 12);
    ctx.lineTo(cx - 27, cy - 31);
    ctx.lineTo(cx - 12, cy - 21);
    ctx.closePath();
    ctx.fill();

    // Right ear
    ctx.fillStyle = palette.main;
    ctx.beginPath();
    ctx.moveTo(cx + 24, cy - 10);
    ctx.lineTo(cx + 30, cy - 36);
    ctx.lineTo(cx + 10, cy - 22);
    ctx.closePath();
    ctx.fill();

    // Right inner ear
    ctx.fillStyle = palette.innerEar;
    ctx.beginPath();
    ctx.moveTo(cx + 22, cy - 12);
    ctx.lineTo(cx + 27, cy - 31);
    ctx.lineTo(cx + 12, cy - 21);
    ctx.closePath();
    ctx.fill();

    // Head Base
    ctx.fillStyle = palette.main;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 6, 28, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Calico / Orange pattern on forehead
    if (this.fur === 'calico') {
      ctx.fillStyle = palette.dark;
      ctx.beginPath();
      ctx.arc(cx - 14, cy - 16, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.fur === 'orange') {
      ctx.strokeStyle = palette.dark;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy - 26);
      ctx.lineTo(cx - 4, cy - 16);
      ctx.moveTo(cx, cy - 28);
      ctx.lineTo(cx, cy - 15);
      ctx.moveTo(cx + 6, cy - 26);
      ctx.lineTo(cx + 4, cy - 16);
      ctx.stroke();
    }

    // Snout / Cheeks
    ctx.fillStyle = palette.snout;
    ctx.beginPath();
    ctx.ellipse(cx - 6, cy + 3, 9, 7, -0.2, 0, Math.PI * 2);
    ctx.ellipse(cx + 6, cy + 3, 9, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Pink Blush
    ctx.fillStyle = palette.blush;
    ctx.beginPath();
    ctx.ellipse(cx - 18, cy + 2, 7, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 18, cy + 2, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    this.drawEyes(cx, cy - 6, palette);

    // Cute Nose
    ctx.fillStyle = '#ff758f';
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy);
    ctx.lineTo(cx + 3, cy);
    ctx.lineTo(cx, cy + 3);
    ctx.closePath();
    ctx.fill();

    // Mouth (:3 or :o)
    ctx.strokeStyle = '#4a3b32';
    ctx.lineWidth = 2;
    if (this.state === 'meow') {
      ctx.fillStyle = '#ff758f';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 6, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(cx - 3.5, cy + 4, 3.5, 0.1, Math.PI * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 3.5, cy + 4, 3.5, 0.1, Math.PI * 0.9);
      ctx.stroke();
    }

    // Whiskers
    ctx.strokeStyle = 'rgba(74, 59, 50, 0.6)';
    ctx.lineWidth = 1.5;
    // Left whiskers
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy + 2);
    ctx.lineTo(cx - 32, cy - 2);
    ctx.moveTo(cx - 14, cy + 5);
    ctx.lineTo(cx - 30, cy + 8);
    ctx.stroke();
    // Right whiskers
    ctx.beginPath();
    ctx.moveTo(cx + 14, cy + 2);
    ctx.lineTo(cx + 32, cy - 2);
    ctx.moveTo(cx + 14, cy + 5);
    ctx.lineTo(cx + 30, cy + 8);
    ctx.stroke();
  }

  drawEyes(cx, cy, palette) {
    const ctx = this.ctx;

    if (this.state === 'petted') {
      // Blissful curved eyes (^-^)
      ctx.strokeStyle = '#4a3b32';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx - 11, cy - 2, 7, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 11, cy - 2, 7, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      return;
    }

    if (this.isBlinking) {
      // Closed line eyes (- -)
      ctx.strokeStyle = '#4a3b32';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 17, cy);
      ctx.lineTo(cx - 6, cy);
      ctx.moveTo(cx + 6, cy);
      ctx.lineTo(cx + 17, cy);
      ctx.stroke();
      return;
    }

    // Big Kawaii Open Eyes
    const eyeRadius = 7.5;
    [cx - 11, cx + 11].forEach(ex => {
      // Eye Iris
      ctx.fillStyle = palette.eyes;
      ctx.beginPath();
      ctx.ellipse(ex, cy, eyeRadius, eyeRadius * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.ellipse(ex, cy, eyeRadius * 0.7, eyeRadius * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      // Big Shine Highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - 2.5, cy - 3, 3, 0, Math.PI * 2);
      ctx.fill();

      // Small secondary highlight
      ctx.beginPath();
      ctx.arc(ex + 2, cy + 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawAccessory(cx, cy) {
    const ctx = this.ctx;

    if (this.accessory === 'bell') {
      // Collar band
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.roundRect(cx - 15, cy + 11, 30, 5, 2);
      ctx.fill();

      // Golden Bell
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(cx, cy + 16, 5, 0, Math.PI * 2);
      ctx.fill();

      // Bell highlight & slit
      ctx.fillStyle = '#b7950b';
      ctx.beginPath();
      ctx.arc(cx, cy + 17, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.accessory === 'bow') {
      // Dapper Red Bowtie
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.moveTo(cx, cy + 14);
      ctx.lineTo(cx - 10, cy + 9);
      ctx.lineTo(cx - 10, cy + 19);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx, cy + 14);
      ctx.lineTo(cx + 10, cy + 9);
      ctx.lineTo(cx + 10, cy + 19);
      ctx.closePath();
      ctx.fill();

      // Center knot
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.arc(cx, cy + 14, 3.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.accessory === 'hat') {
      // Party / Wizard cone hat
      ctx.fillStyle = '#9b59b6';
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy - 24);
      ctx.lineTo(cx + 12, cy - 24);
      ctx.lineTo(cx, cy - 54);
      ctx.closePath();
      ctx.fill();

      // Stripes on hat
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy - 32);
      ctx.lineTo(cx + 8, cy - 32);
      ctx.moveTo(cx - 4, cy - 42);
      ctx.lineTo(cx + 4, cy - 42);
      ctx.stroke();

      // Pompom / Star on tip
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(cx, cy - 55, 4.5, 0, Math.PI * 2);
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
        ctx.fillStyle = '#ff4d6d';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-6, -6, -10, 2, 0, 10);
        ctx.bezierCurveTo(10, 2, 6, -6, 0, 0);
        ctx.fill();
      } else if (p.type === 'zzz') {
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = '#6c5ce7';
        ctx.fillText('Z', 0, 0);
      } else if (p.type === 'note') {
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = '#fd79a8';
        ctx.fillText('♪', 0, 0);
      } else if (p.type === 'sparkle') {
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }
}

window.CatRenderer = CatRenderer;
