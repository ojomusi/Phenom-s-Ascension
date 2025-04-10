// Pathfinding and game utilities
class PathFinder {
    constructor(scene) {
        this.scene = scene;
        this.updateCounter = 0;
        this.pathUpdateFrequency = 3; // Update path every 3 frames
        this.cachedPath = null;
        this.movementThreshold = 20; // Minimum distance to move
        this.lastDirection = new Map(); // Store last movement direction for each enemy
        this.directionTimer = new Map(); // Store time spent moving in one direction
    }

    // Dijkstra's algorithm implementation
    findShortestPath(start, end, platforms) {
        // Create graph from platforms
        const graph = this.createGraphFromPlatforms(platforms);
        
        // Initialize costs and parents
        const costs = {};
        const parents = {};
        const processed = [];
        
        // Set initial costs
        for (let node in graph) {
            costs[node] = Infinity;
        }
        costs[start] = 0;
        
        // Find lowest cost node
        let node = this.findLowestCostNode(costs, processed);
        
        while (node) {
            const cost = costs[node];
            const neighbors = graph[node];
            
            // Check each neighbor
            for (let neighbor in neighbors) {
                const newCost = cost + neighbors[neighbor];
                if (!costs[neighbor] || costs[neighbor] > newCost) {
                    costs[neighbor] = newCost;
                    parents[neighbor] = node;
                }
            }
            
            processed.push(node);
            node = this.findLowestCostNode(costs, processed);
        }
        
        // Build path
        const path = [];
        let current = end;
        
        while (current) {
            path.unshift(current);
            current = parents[current];
        }
        
        return path;
    }
    
    createGraphFromPlatforms(platforms) {
        const graph = {};
        
        // Create nodes for each platform edge and connections
        platforms.forEach((platform, i) => {
            const leftEdge = `p${i}_left`;
            const rightEdge = `p${i}_right`;
            const centerPoint = `p${i}_center`;
            
            // Add platform edges and center to graph
            graph[leftEdge] = {};
            graph[rightEdge] = {};
            graph[centerPoint] = {};
            
            // Connect edges to center
            graph[leftEdge][centerPoint] = platform.width / 2;
            graph[rightEdge][centerPoint] = platform.width / 2;
            graph[centerPoint][leftEdge] = platform.width / 2;
            graph[centerPoint][rightEdge] = platform.width / 2;
            
            // Connect to other platforms if reachable
            platforms.forEach((otherPlatform, j) => {
                if (i !== j) {
                    const verticalDist = Math.abs(platform.y - otherPlatform.y);
                    const horizontalDist = Math.abs(platform.x - otherPlatform.x);
                    
                    // Check if platforms are within jumping distance
                    if (verticalDist < 200 && horizontalDist < 300) {
                        const weight = Math.sqrt(verticalDist * verticalDist + horizontalDist * horizontalDist);
                        graph[centerPoint][`p${j}_center`] = weight;
                    }
                }
            });
        });
        
        return graph;
    }
    
    findLowestCostNode(costs, processed) {
        return Object.keys(costs).reduce((lowest, node) => {
            if (lowest === null && !processed.includes(node)) {
                lowest = node;
            }
            if (!processed.includes(node) && costs[node] < costs[lowest]) {
                lowest = node;
            }
            return lowest;
        }, null);
    }

    findPathToPlayer(enemy) {
        if (!enemy.active || !this.scene.player.active) return;

        // Initialize enemy state if needed
        if (!enemy.roamingState) {
            enemy.roamingState = {
                direction: Math.random() < 0.5 ? -1 : 1,
                timer: 0,
                duration: Phaser.Math.Between(60, 180)
            };
        }

        // Get the platform (if any) that enemy and player are currently on
        const enemyPlatform = this.getCurrentPlatform(enemy);
        const playerPlatform = this.getCurrentPlatform(this.scene.player);

        // Initialize direction tracking if needed
        if (!this.lastDirection.has(enemy)) {
            this.lastDirection.set(enemy, 0);
            this.directionTimer.set(enemy, 0);
        }
        this.directionTimer.set(enemy, this.directionTimer.get(enemy) + 1);

        // Check if player is in sight (using the scene's vision cone check)
        const canSeePlayer = this.scene.isPlayerInVisionCone && this.scene.isPlayerInVisionCone(enemy);

        // If not in sight, use roaming behavior
        if (!canSeePlayer) {
            this.handleRoaming(enemy, enemyPlatform);
            return;
        }

        // Reset roaming state when player is spotted
        enemy.roamingState.timer = 0;

        // If the enemy isn't on a platform, try to find the nearest one and move toward it
        if (!enemyPlatform) {
            const nearestPlatform = this.findNearestPlatform(enemy);
            if (nearestPlatform) {
                this.moveTowardsPlatform(enemy, nearestPlatform);
            }
            return;
        }

        // Rest of the pursuit logic remains the same
        const distanceToPlayer = Phaser.Math.Distance.Between(
            enemy.x, enemy.y,
            this.scene.player.x, this.scene.player.y
        );
        const horizontalDiff = this.scene.player.x - enemy.x;
        const verticalDiff = this.scene.player.y - enemy.y;
        const isPlayerAbove = verticalDiff < -50;

        let baseSpeed = 80;
        if (distanceToPlayer < 60) {
            baseSpeed = 40;
        }

        let targetPlatform = playerPlatform;
        if (isPlayerAbove) {
            targetPlatform = this.findJumpablePlatform(enemy) || playerPlatform;
        }

        let moveDirection = 0;
        const currentDirection = Math.sign(enemy.body.velocity.x);
        const directionTimer = this.directionTimer.get(enemy);

        if (directionTimer > 60 && Math.abs(horizontalDiff) > 100) {
            this.directionTimer.set(enemy, 0);
            moveDirection = -currentDirection;
        } else {
            if (targetPlatform) {
                const platformCenter = targetPlatform.x;
                const distanceToCenter = platformCenter - enemy.x;
                if (Math.abs(distanceToCenter) > this.movementThreshold) {
                    moveDirection = Math.sign(distanceToCenter);
                } else {
                    moveDirection = Math.sign(horizontalDiff);
                }
            } else {
                if (Math.abs(horizontalDiff) > this.movementThreshold) {
                    moveDirection = Math.sign(horizontalDiff);
                    if (Math.random() < 0.1) {
                        moveDirection *= -1;
                    }
                }
            }
        }

        const targetVelocity = moveDirection * baseSpeed;
        const currentVelocity = enemy.body.velocity.x;
        const acceleration = 10;
        if (Math.abs(targetVelocity - currentVelocity) > acceleration) {
            enemy.setVelocityX(currentVelocity + Math.sign(targetVelocity - currentVelocity) * acceleration);
        } else {
            enemy.setVelocityX(targetVelocity);
        }

        if (moveDirection !== 0) {
            enemy.flipX = moveDirection < 0;
        }

        if (enemy.body.touching.down) {
            if (isPlayerAbove && targetPlatform && Math.abs(enemy.x - targetPlatform.x) < 100) {
                enemy.setVelocityY(-300);
            } else if (this.shouldJumpGap(enemy, moveDirection)) {
                enemy.setVelocityY(-300);
            }
        }

        this.lastDirection.set(enemy, moveDirection);
    }

    handleRoaming(enemy, currentPlatform) {
        // Update roaming timer
        enemy.roamingState.timer++;

        // Change direction if timer expires or near platform edge
        if (enemy.roamingState.timer >= enemy.roamingState.duration || 
            (currentPlatform && this.isNearPlatformEdge(enemy, currentPlatform))) {
            
            enemy.roamingState.direction *= -1;
            enemy.roamingState.timer = 0;
            enemy.roamingState.duration = Phaser.Math.Between(60, 180);
        }

        // Random chance to pause
        if (Math.random() < 0.005) {
            enemy.setVelocityX(0);
            return;
        }

        // Move in current roaming direction
        const roamingSpeed = 40; // Slower speed while roaming
        enemy.setVelocityX(enemy.roamingState.direction * roamingSpeed);
        enemy.flipX = enemy.roamingState.direction < 0;

        // Jump occasionally when encountering gaps
        if (enemy.body.touching.down && this.shouldJumpGap(enemy, enemy.roamingState.direction)) {
            if (Math.random() < 0.3) { // Only 30% chance to jump over gaps while roaming
                enemy.setVelocityY(-300);
            } else {
                // Turn around instead of jumping
                enemy.roamingState.direction *= -1;
                enemy.roamingState.timer = 0;
            }
        }
    }

    shouldJumpGap(enemy, moveDirection) {
        if (!enemy.body.touching.down) return false;

        const lookAheadDistance = 50;
        const groundCheckX = enemy.x + (moveDirection * lookAheadDistance);
        const groundCheckY = enemy.y + 50;

        // Check if there's ground ahead
        const hasGroundAhead = this.scene.platforms.getChildren().some(platform => {
            return groundCheckX >= platform.x - platform.width/2 &&
                   groundCheckX <= platform.x + platform.width/2 &&
                   groundCheckY >= platform.y - platform.height/2 &&
                   groundCheckY <= platform.y + platform.height/2;
        });

        // Jump if there's no ground ahead and we're moving
        return !hasGroundAhead && moveDirection !== 0;
    }

    findJumpablePlatform(enemy) {
        let bestPlatform = null;
        let bestScore = Infinity;

        this.scene.platforms.getChildren().forEach(platform => {
            // Skip current platform
            if (platform === this.getCurrentPlatform(enemy)) return;

            // Check if platform is above enemy
            if (platform.y >= enemy.y) return;

            // Calculate horizontal distance
            const horizontalDist = Math.abs(platform.x - enemy.x);
            
            // Calculate vertical distance
            const verticalDist = enemy.y - platform.y;

            // Score based on distance to player and jump feasibility
            const score = horizontalDist + verticalDist * 2;

            // Update best platform if this one is better
            if (score < bestScore && verticalDist < 200) { // Max jump height
                bestPlatform = platform;
                bestScore = score;
            }
        });

        return bestPlatform;
    }

    findSafeDropEdge(enemy, platform) {
        if (!platform) return null;
        
        const leftEdge = platform.x - platform.width/2;
        const rightEdge = platform.x + platform.width/2;
        
        // Add safety margin to edges
        const safetyMargin = 30;
        const safePlatformLeft = leftEdge + safetyMargin;
        const safePlatformRight = rightEdge - safetyMargin;
        
        // Choose edge closer to player but within safety margin
        if (Math.abs(this.scene.player.x - safePlatformLeft) < Math.abs(this.scene.player.x - safePlatformRight)) {
            return safePlatformLeft;
        }
        return safePlatformRight;
    }

    findJumpPoint(enemy, targetPlatform) {
        if (!targetPlatform) return enemy.x;
        
        // Calculate jump point slightly inward from platform edge
        const edgeOffset = 20;
        if (enemy.x < targetPlatform.x) {
            return targetPlatform.x - targetPlatform.width/2 + edgeOffset;
        }
        return targetPlatform.x + targetPlatform.width/2 - edgeOffset;
    }

    directApproach(enemy) {
        const distanceToPlayer = Phaser.Math.Distance.Between(
            enemy.x, enemy.y,
            this.scene.player.x, this.scene.player.y
        );

        // Check if enemy is roughly aligned vertically with player (within 10 pixels)
        const isVerticallyAligned = Math.abs(enemy.x - this.scene.player.x) < 10;
        
        // If vertically aligned and on different platforms, find a better approach
        if (isVerticallyAligned && Math.abs(enemy.y - this.scene.player.y) > 50) {
            this.handleVerticalAlignment(enemy);
            return;
        }

        // Maintain some distance for attack range
        
        const speed = 80;
        // Add slight randomization to prevent perfect stacking
        const randomOffset = Phaser.Math.Between(-20, 20);
        const targetX = this.scene.player.x + randomOffset;
        enemy.setVelocityX(enemy.x < targetX ? speed : -speed);
        enemy.flipX = enemy.body.velocity.x < 0;
        
    }

    handleVerticalAlignment(enemy) {
        // Find the nearest platform that's not directly above/below
        const currentPlatform = this.getCurrentPlatform(enemy);
        if (!currentPlatform) return;

        // Determine which direction to move based on platform layout
        const platforms = this.scene.platforms.getChildren();
        let bestMove = 0;
        
        // Find platforms that could be used to reach the player
        const viablePlatforms = platforms.filter(platform => 
            Math.abs(platform.y - this.scene.player.y) < Math.abs(enemy.y - this.scene.player.y) &&
            Math.abs(platform.x - enemy.x) < 200
        );

        if (viablePlatforms.length > 0) {
            // Move towards the nearest viable platform
            const nearestPlatform = viablePlatforms.reduce((nearest, current) => 
                Phaser.Math.Distance.Between(enemy.x, enemy.y, current.x, current.y) <
                Phaser.Math.Distance.Between(enemy.x, enemy.y, nearest.x, nearest.y) 
                ? current : nearest
            );
            bestMove = nearestPlatform.x > enemy.x ? 80 : -80;
        } else {
            // If no viable platforms, move in a random direction to break the vertical alignment
            bestMove = Phaser.Math.Between(0, 1) ? 80 : -80;
        }

        enemy.setVelocityX(bestMove);
        enemy.flipX = bestMove < 0;

        // Jump if there's a platform above that we can reach
        if (enemy.body.touching.down) {
            const platformAbove = platforms.find(platform => 
                platform.y < enemy.y &&
                Math.abs(platform.x - enemy.x) < 100 &&
                enemy.y - platform.y < 200
            );
            
            if (platformAbove) {
                enemy.setVelocityY(-300);
            }
        }
    }

    findNearestPlatform(sprite) {
        let nearest = null;
        let nearestDist = Infinity;
        
        this.scene.platforms.getChildren().forEach(platform => {
            const dist = Phaser.Math.Distance.Between(
                sprite.x, sprite.y,
                platform.x, platform.y - platform.height/2
            );
            if (dist < nearestDist) {
                nearest = platform;
                nearestDist = dist;
            }
        });
        
        return nearest;
    }

    getCurrentPlatform(sprite) {
        if (!sprite.body.touching.down) return null;
        
        return this.scene.platforms.getChildren().find(platform => {
            return Math.abs(sprite.y - (platform.y - platform.height/2)) < 10 &&
                   Math.abs(sprite.x - platform.x) < platform.width/2;
        });
    }

    moveTowardsPlatform(enemy, platform) {
        if (!platform) return;
        
        // Add safety margin to prevent moving too close to edges
        const safetyMargin = 30;
        const leftBound = platform.x - platform.width/2 + safetyMargin;
        const rightBound = platform.x + platform.width/2 - safetyMargin;
        
        // If enemy is within bounds, move towards platform center
        if (enemy.x < leftBound || enemy.x > rightBound) {
            const targetX = platform.x;
            enemy.setVelocityX(enemy.x < targetX ? 80 : -80);
        } else {
            // Stay on platform if already in safe zone
            enemy.setVelocityX(0);
        }
    }

    // Add new method to check if entity is near platform edge
    isNearPlatformEdge(entity, platform) {
        if (!platform) return false;  // Return false if no platform
        
        const edgeThreshold = 20; // Distance from edge to consider "near"
        const leftEdge = platform.x - platform.width/2;
        const rightEdge = platform.x + platform.width/2;
        
        return (Math.abs(entity.x - leftEdge) < edgeThreshold || 
                Math.abs(entity.x - rightEdge) < edgeThreshold);
    }
}

// Export for use in main game
window.PathFinder = PathFinder; 