export class ThinPlateSpline {
  private w_u: number[] = [];
  private a_u: number[] = [];
  private w_v: number[] = [];
  private a_v: number[] = [];
  private pts: [number, number][] = [];

  constructor(sourcePoints: [number, number][], targetPoints: [number, number][]) {
    this.pts = sourcePoints;
    const n = sourcePoints.length;
    const matrix = this.buildMatrix(sourcePoints);
    const invMatrix = this.invertMatrix(matrix);
    if (!invMatrix) throw new Error("Matrix inversion failed. Points might be collinear.");

    const Vu = [...targetPoints.map(p => p[0]), 0, 0, 0];
    const Vv = [...targetPoints.map(p => p[1]), 0, 0, 0];

    const Wu = this.multiplyMatrixVector(invMatrix, Vu);
    const Wv = this.multiplyMatrixVector(invMatrix, Vv);

    this.w_u = Wu.slice(0, n);
    this.a_u = Wu.slice(n);
    this.w_v = Wv.slice(0, n);
    this.a_v = Wv.slice(n);
  }

  private U(r: number): number {
    if (r === 0) return 0;
    return r * r * Math.log(r * r);
  }

  private dist(p1: [number, number], p2: [number, number]): number {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  private buildMatrix(pts: [number, number][]): number[][] {
    const n = pts.length;
    const size = n + 3;
    const M = Array(size).fill(0).map(() => Array(size).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        M[i][j] = this.U(this.dist(pts[i], pts[j]));
      }
      M[i][n] = 1;
      M[i][n + 1] = pts[i][0];
      M[i][n + 2] = pts[i][1];
      M[n][i] = 1;
      M[n + 1][i] = pts[i][0];
      M[n + 2][i] = pts[i][1];
    }
    return M;
  }

  private invertMatrix(M: number[][]): number[][] | null {
    const n = M.length;
    const I = Array(n).fill(0).map((_, i) => {
      const row = Array(n).fill(0);
      row[i] = 1;
      return row;
    });

    const A = M.map(row => [...row]);

    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(A[j][i]) > Math.abs(A[maxRow][i])) {
          maxRow = j;
        }
      }

      if (Math.abs(A[maxRow][i]) < 1e-10) return null;

      const tempA = A[i];
      A[i] = A[maxRow];
      A[maxRow] = tempA;

      const tempI = I[i];
      I[i] = I[maxRow];
      I[maxRow] = tempI;

      const pivot = A[i][i];
      for (let j = 0; j < n; j++) {
        A[i][j] /= pivot;
        I[i][j] /= pivot;
      }

      for (let j = 0; j < n; j++) {
        if (j !== i) {
          const factor = A[j][i];
          for (let k = 0; k < n; k++) {
            A[j][k] -= factor * A[i][k];
            I[j][k] -= factor * I[i][k];
          }
        }
      }
    }
    return I;
  }

  private multiplyMatrixVector(M: number[][], V: number[]): number[] {
    return M.map(row => row.reduce((sum, val, i) => sum + val * V[i], 0));
  }

  public transform(x: number, y: number): [number, number] {
    let u = this.a_u[0] + this.a_u[1] * x + this.a_u[2] * y;
    let v = this.a_v[0] + this.a_v[1] * x + this.a_v[2] * y;

    for (let i = 0; i < this.pts.length; i++) {
      const r = this.dist([x, y], this.pts[i]);
      const ur = this.U(r);
      u += this.w_u[i] * ur;
      v += this.w_v[i] * ur;
    }

    return [u, v];
  }
}
