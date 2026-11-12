import * as THREE from 'three';

export interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  name?: string;
}

export class CollisionSystem {
  public obstacles: CollisionBox[] = [];
  public gridResolution: number = 0.5; // 0.5m grid
  private minX: number = -22;
  private maxX: number = 22;
  private minZ: number = -17;
  private maxZ: number = 17;
  private gridWidth: number = 0;
  private gridHeight: number = 0;
  private walkableGrid: boolean[][] = [];

  constructor() {
    this.initGrid();
  }

  private initGrid() {
    this.gridWidth = Math.ceil((this.maxX - this.minX) / this.gridResolution);
    this.gridHeight = Math.ceil((this.maxZ - this.minZ) / this.gridResolution);
    this.walkableGrid = Array(this.gridHeight)
      .fill(false)
      .map(() => Array(this.gridWidth).fill(true));
  }

  public addBox(minX: number, maxX: number, minZ: number, maxZ: number, name?: string) {
    this.obstacles.push({ minX, maxX, minZ, maxZ, name });
    this.rasterizeBox({ minX, maxX, minZ, maxZ });
  }

  public addBoxFromObject(obj: { x: number; z: number; width: number; depth: number }, name?: string) {
    const halfW = obj.width / 2;
    const halfD = obj.depth / 2;
    this.addBox(obj.x - halfW, obj.x + halfW, obj.z - halfD, obj.z + halfD, name);
  }

  private rasterizeBox(box: CollisionBox) {
    // Add small buffer for player radius (0.4m)
    const buffer = 0.35;
    const startX = Math.max(0, Math.floor((box.minX - buffer - this.minX) / this.gridResolution));
    const endX = Math.min(this.gridWidth - 1, Math.ceil((box.maxX + buffer - this.minX) / this.gridResolution));
    const startZ = Math.max(0, Math.floor((box.minZ - buffer - this.minZ) / this.gridResolution));
    const endZ = Math.min(this.gridHeight - 1, Math.ceil((box.maxZ + buffer - this.minZ) / this.gridResolution));

    for (let gz = startZ; gz <= endZ; gz++) {
      for (let gx = startX; gx <= endX; gx++) {
        this.walkableGrid[gz][gx] = false;
      }
    }
  }

  /**
   * Continuous circle-box collision detection with slide vector
   */
  public resolveMovement(currentX: number, currentZ: number, nextX: number, nextZ: number, radius: number = 0.4): { x: number; z: number } {
    let targetX = nextX;
    let targetZ = nextZ;

    // Boundary check
    targetX = Math.max(this.minX + radius, Math.min(this.maxX - radius, targetX));
    targetZ = Math.max(this.minZ + radius, Math.min(this.maxZ - radius, targetZ));

    // Check against all obstacles
    for (const box of this.obstacles) {
      // Find closest point on box to circle center
      const closestX = Math.max(box.minX, Math.min(box.maxX, targetX));
      const closestZ = Math.max(box.minZ, Math.min(box.maxZ, targetZ));

      const dx = targetX - closestX;
      const dz = targetZ - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          // Push circle out along collision normal
          const overlap = radius - dist;
          targetX += (dx / dist) * overlap;
          targetZ += (dz / dist) * overlap;
        } else {
          // Deep penetration fallback: reject next pos, maintain current
          targetX = currentX;
          targetZ = currentZ;
        }
      }
    }

    return { x: targetX, z: targetZ };
  }

  public isPointWalkable(x: number, z: number): boolean {
    if (x < this.minX || x > this.maxX || z < this.minZ || z > this.maxZ) return false;
    const gx = Math.floor((x - this.minX) / this.gridResolution);
    const gz = Math.floor((z - this.minZ) / this.gridResolution);
    if (gz < 0 || gz >= this.gridHeight || gx < 0 || gx >= this.gridWidth) return false;
    return this.walkableGrid[gz][gx];
  }

  /**
   * A* Pathfinding algorithm to navigate around walls and doors
   */
  public findPath(startX: number, startZ: number, goalX: number, goalZ: number): { x: number; z: number }[] {
    const startGX = Math.max(0, Math.min(this.gridWidth - 1, Math.floor((startX - this.minX) / this.gridResolution)));
    const startGZ = Math.max(0, Math.min(this.gridHeight - 1, Math.floor((startZ - this.minZ) / this.gridResolution)));
    let goalGX = Math.max(0, Math.min(this.gridWidth - 1, Math.floor((goalX - this.minX) / this.gridResolution)));
    let goalGZ = Math.max(0, Math.min(this.gridHeight - 1, Math.floor((goalZ - this.minZ) / this.gridResolution)));

    // If goal is inside obstacle, find closest walkable cell
    if (!this.walkableGrid[goalGZ][goalGX]) {
      let found = false;
      for (let r = 1; r <= 5; r++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            const ny = goalGZ + dy;
            const nx = goalGX + dx;
            if (ny >= 0 && ny < this.gridHeight && nx >= 0 && nx < this.gridWidth && this.walkableGrid[ny][nx]) {
              goalGZ = ny;
              goalGX = nx;
              found = true;
              break;
            }
          }
          if (found) break;
        }
        if (found) break;
      }
      if (!found) return [];
    }

    interface Node {
      gx: number;
      gz: number;
      g: number;
      h: number;
      f: number;
      parent?: Node;
    }

    const openList: Node[] = [];
    const closedSet = new Set<string>();

    const hCost = (ax: number, az: number, bx: number, bz: number) => {
      const dx = Math.abs(ax - bx);
      const dz = Math.abs(az - bz);
      return Math.sqrt(dx * dx + dz * dz);
    };

    const startNode: Node = {
      gx: startGX,
      gz: startGZ,
      g: 0,
      h: hCost(startGX, startGZ, goalGX, goalGZ),
      f: hCost(startGX, startGZ, goalGX, goalGZ),
    };
    openList.push(startNode);

    const neighbors = [
      { dx: 1, dz: 0, cost: 1 },
      { dx: -1, dz: 0, cost: 1 },
      { dx: 0, dz: 1, cost: 1 },
      { dx: 0, dz: -1, cost: 1 },
      { dx: 1, dz: 1, cost: 1.414 },
      { dx: -1, dz: 1, cost: 1.414 },
      { dx: 1, dz: -1, cost: 1.414 },
      { dx: -1, dz: -1, cost: 1.414 },
    ];

    let maxSteps = 1200;
    while (openList.length > 0 && maxSteps-- > 0) {
      // Find lowest f node
      let lowestIdx = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[lowestIdx].f) {
          lowestIdx = i;
        }
      }

      const current = openList.splice(lowestIdx, 1)[0];
      const key = `${current.gx},${current.gz}`;
      closedSet.add(key);

      // Reached destination
      if (current.gx === goalGX && current.gz === goalGZ) {
        const path: { x: number; z: number }[] = [];
        let curr: Node | undefined = current;
        while (curr) {
          path.unshift({
            x: this.minX + (curr.gx + 0.5) * this.gridResolution,
            z: this.minZ + (curr.gz + 0.5) * this.gridResolution,
          });
          curr = curr.parent;
        }

        // Simplify path: eliminate collinear/redundant nodes
        return this.smoothPath(path);
      }

      for (const n of neighbors) {
        const nx = current.gx + n.dx;
        const nz = current.gz + n.dz;

        if (nx < 0 || nx >= this.gridWidth || nz < 0 || nz >= this.gridHeight) continue;
        if (!this.walkableGrid[nz][nx]) continue;

        // Diagonal cut prevention
        if (n.dx !== 0 && n.dz !== 0) {
          if (!this.walkableGrid[current.gz][nx] || !this.walkableGrid[nz][current.gx]) {
            continue;
          }
        }

        const nKey = `${nx},${nz}`;
        if (closedSet.has(nKey)) continue;

        const tentativeG = current.g + n.cost;
        const existingNode = openList.find((node) => node.gx === nx && node.gz === nz);

        if (!existingNode) {
          const h = hCost(nx, nz, goalGX, goalGZ);
          openList.push({
            gx: nx,
            gz: nz,
            g: tentativeG,
            h,
            f: tentativeG + h,
            parent: current,
          });
        } else if (tentativeG < existingNode.g) {
          existingNode.g = tentativeG;
          existingNode.f = tentativeG + existingNode.h;
          existingNode.parent = current;
        }
      }
    }

    // Fallback: direct line to closest accessible
    return [{ x: goalX, z: goalZ }];
  }

  private smoothPath(rawPath: { x: number; z: number }[]): { x: number; z: number }[] {
    if (rawPath.length <= 2) return rawPath;

    const smoothed: { x: number; z: number }[] = [rawPath[0]];
    let currentIdx = 0;

    while (currentIdx < rawPath.length - 1) {
      let furthestVisible = currentIdx + 1;
      for (let testIdx = rawPath.length - 1; testIdx > currentIdx + 1; testIdx--) {
        if (this.hasLineOfSight(rawPath[currentIdx], rawPath[testIdx])) {
          furthestVisible = testIdx;
          break;
        }
      }
      smoothed.push(rawPath[furthestVisible]);
      currentIdx = furthestVisible;
    }

    return smoothed;
  }

  private hasLineOfSight(p1: { x: number; z: number }, p2: { x: number; z: number }): boolean {
    const dist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.z - p1.z) ** 2);
    const steps = Math.ceil(dist / 0.3);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const sampleX = p1.x + (p2.x - p1.x) * t;
      const sampleZ = p1.z + (p2.z - p1.z) * t;
      if (!this.isPointWalkable(sampleX, sampleZ)) return false;
    }
    return true;
  }
}
