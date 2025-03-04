# **Phenom's Ascension**  

![](https://github.com/ojomusi/Phenom-s-Ascension/blob/main/assets/images/backgrounds/landing.png)  

## **Overview**  

**Phenom's Ascension** is a **2D action-platformer** built with **JavaScript and Phaser 3**. The game follows **Joel, a young Hunter**, who uncovers corruption within the Hunter Association and embarks on a journey to bring down its corrupt leader, **Kain**.  

### **Core Gameplay Loop**  
- Battle through **5 unique levels**, each with different enemies, bosses, and challenges.  
- Unlock **new abilities** as you progress.  
- Uncover the **secrets of the Hunter Association** and **defeat Kain**.  


---

## **Phenom's Ascension (GPT) – AI-Powered Interactive Adventure**  

**Phenom's Ascension (GPT)** is an **AI-driven interactive adventure** that laid the foundation for the game's **story, morality system, and progression mechanics**. Inspired by *Solo Leveling* and *Kingdom Hearts*, it allows players to step into a **dynamic, choice-based world** where **every decision** shapes their journey.  

### **Key Features:**  
✅ **Adaptive Storytelling** – Choices lead to multiple endings, including a *Kingdom Hearts*-style emotional conclusion.  
✅ **Leveling System & Power Growth** – Grow stronger, but risk **emotional detachment** like biblical figures (Saul, Solomon, Samson).  
✅ **Faith & Morality System** – Your **decisions impact** the game world and how characters respond to you.  
✅ **Companions & Guilds** – Recruit allies or go solo.  
✅ **Randomized Events & Hidden Paths** – Every playthrough offers something **unexpected**.  

This GPT-driven story was the **blueprint** for the game’s **narrative and mechanics**.  

---

## **Technical Features**  

### **Core Technologies**  
- **Pure JavaScript** – No external libraries beyond Phaser 3  
- **HTML5 Canvas** – Hardware-accelerated rendering  
- **Phaser 3 Framework** – For game physics, animations, and scene management  
- **Procedural Asset Generation** – Assets are **dynamically created** in code and exported to PNGs  

### **Implementation Highlights**  
✅ **Advanced Scene Management** – Multi-scene architecture for seamless transitions  
✅ **State Machine Pattern** – Controls **player and enemy behaviors**  
✅ **Physics-Based Gameplay** – Arcade Physics for **realistic movement & collisions**  
✅ **Particle Effects System** – **Custom emitters** for visual impact  
✅ **Responsive Controls** – Smooth, **highly responsive player input**  

---

## **Performance Metrics**  
- **60 FPS** maintained on standard devices  
- **~16ms frame rendering time**  
- **Asset bundle <1MB** (all sprites procedurally generated)  
- **Zero external dependencies** beyond Phaser  

---

## **Code Architecture**  

```
phenoms-ascension/
├── assets/                 # Game assets
│   ├── images/             # Backgrounds, sprites, UI
├── src/                    # Source code
│   ├── scenes/             # Game scenes (Boot, Preload, Menu, Level, UI)
│   ├── characters/         # Character classes
│   ├── utils/              # Utility functions
│   └── main.js             # Entry point
├── Phenoms Ascension.html  # Main HTML file
└── README.md               # This file
```

---

## **Development Insights**  

### **Procedural Asset Generation**  
Instead of relying on **pre-made sprites**, all assets are **programmatically drawn** using the **Canvas API**:  
1. **Characters** – Generated dynamically using frame-based animation.  
2. **Backgrounds** – Created with **gradient fills and geometric shapes**.  
3. **Effects** – Custom **particle systems** and dynamic lighting.  
4. **Optimized PNGs** – Assets are exported at build time for **performance**.  

```javascript
// Example of procedural sprite generation
function createPlayerSpritesheet() {
  const canvas = document.createElement('canvas');
  canvas.width = 1344; // 64px * 21 frames
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
 
  // Draw character frames programmatically
  for (let i = 0; i < 21; i++) {
    const x = i * 64 + 32;
    const y = 32;
    // ... drawing code ...
  }
 
  return canvas.toDataURL('image/png');
}
```

---

## **Gameplay Features**  

🎯 **5 Distinct Levels** – Each with **unique enemies, hazards, and environments**  
🎯 **Multiple Enemy Types** – Different **attack patterns and behaviors**  
🎯 **Boss Battles** – Epic fights with **pattern-based mechanics**  
🎯 **Progressive Abilities** – Gain **new skills** as you advance  
🎯 **Story Integration** – Narrative unfolds through **dialogue & cutscenes**  

---

## **Code Sample: Boss Battle AI**  

```javascript
updateBoss() {
  // Basic boss AI based on phase
  switch (this.boss.phase) {
    case 1: // Circling phase
      const distX = this.player.x - this.boss.x;
      const distY = this.player.y - this.boss.y;
      const dist = Math.sqrt(distX * distX + distY * distY);

      if (dist > 200) {
        this.boss.setVelocityX(distX > 0 ? 80 : -80);
        this.boss.flipX = distX < 0;
      } else {
        this.boss.setVelocityX(distY > 0 ? -80 : 80);
        this.boss.flipX = this.boss.body.velocity.x < 0;
      }

      if (this.boss.health <= 70) {
        this.boss.phase = 2;
        this.boss.vulnerable = false;
        this.bossSpecialAttack();
      }
      break;
  }
}
```

---

## **Challenges and Solutions**  

| **Challenge**         | **Solution**                                                  |
|-----------------------|--------------------------------------------------------------|
| **Large Asset Sizes**  | Procedural generation to **minimize file size**            |
| **Complex Animations** | Frame-based **sprite sheets** for fluid movement           |
| **Boss AI**           | State machine with **phase-based combat patterns**          |
| **Performance Issues** | **Optimized collision detection** & object pooling         |

---

## **Future Enhancements**  

🔹 **Mobile-friendly controls**  
🔹 **Local multiplayer support**  
🔹 **Additional levels & bosses**  
🔹 **Achievement system**  
🔹 **Speedrun/Time Trial mode**  

---

## **Running Locally**  

1. **Clone the repository**  
   ```bash
   git clone https://github.com/ojomusi/phenoms-ascension.git
   ```
2. **Navigate to the project directory**  
   ```bash
   cd phenoms-ascension
   ```
3. **Start a local server** (VS Code Live Server or similar)  
4. **Open `Phenoms Ascension.html` in your browser**  

---

## **Credits**  

- **Game Design & Development**: Your Name  
- **Story Concept**: Based on *Phenom's Ascension (GPT)*  
- **Framework**: [Phaser 3](https://phaser.io/)  

---

## **License**  

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.  
