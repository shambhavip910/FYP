"""
5-objective Pareto visualization for NSGA-III OC1.

Produces:
  - Parallel coordinates plot
  - Pairwise scatter matrix
  - Optional 3D projection (vehicles, distance, reliability)
  - Summary statistics printed / saved alongside CSV
"""

from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from mpl_toolkits.mplot3d import Axes3D  # noqa: F401


OBJECTIVE_META = [
    ("vehicles_used", "Vehicles ↓", "min"),
    ("distance", "Distance ↓", "min"),
    ("reliability", "Reliability ↑", "max"),
    ("waiting_time", "Waiting Time ↓", "min"),
    ("delay", "Delay ↓", "min"),
]


def solutions_to_dataframe(solutions):
    rows = []
    for s in solutions:
        rows.append(
            {
                "solution_id": s.get("solution_id"),
                "vehicles_used": s["vehicles_used"],
                "distance": s["distance"],
                "reliability": s["reliability"],
                "waiting_time": s["waiting_time"],
                "delay": s["delay"],
                "constraint_violation": s.get("constraint_violation", 0),
            }
        )
    return pd.DataFrame(rows)


def plot_pareto_analysis(solutions, out_path="results/pareto_front.png"):
    """
    Multi-panel figure for 5-objective Pareto analysis.
    """

    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    df = solutions_to_dataframe(solutions)

    if df.empty:
        raise ValueError("No solutions to visualize")

    fig = plt.figure(figsize=(16, 12))
    fig.suptitle(
        "NSGA-III OC1 — 5-Objective Pareto Front\n"
        "Vehicles↓  Distance↓  Reliability↑  Waiting↓  Delay↓",
        fontsize=13,
    )

    # ---- 1. Parallel coordinates ----
    ax1 = fig.add_subplot(2, 2, 1)
    cols = [m[0] for m in OBJECTIVE_META]
    labels = [m[1] for m in OBJECTIVE_META]

    norm = df[cols].copy()
    for c in cols:
        lo, hi = norm[c].min(), norm[c].max()
        if hi - lo < 1e-12:
            norm[c] = 0.5
        else:
            norm[c] = (norm[c] - lo) / (hi - lo)

    x = np.arange(len(cols))
    for _, row in norm.iterrows():
        ax1.plot(x, row[cols].to_numpy(), alpha=0.45, linewidth=1.2)
    ax1.set_xticks(x)
    ax1.set_xticklabels(labels, rotation=20, ha="right")
    ax1.set_ylabel("Normalized value")
    ax1.set_title("Parallel coordinates")
    ax1.set_ylim(-0.05, 1.05)
    ax1.grid(True, alpha=0.3)

    # ---- 2. Pairwise: distance vs delay, colored by reliability ----
    ax2 = fig.add_subplot(2, 2, 2)
    sc = ax2.scatter(
        df["distance"],
        df["delay"],
        c=df["reliability"],
        cmap="viridis",
        s=40 + 8 * df["vehicles_used"],
        edgecolors="k",
        linewidths=0.3,
    )
    ax2.set_xlabel("Distance ↓")
    ax2.set_ylabel("Delay ↓")
    ax2.set_title("Pairwise: Distance vs Delay (color=Reliability↑)")
    cb = fig.colorbar(sc, ax=ax2, fraction=0.046)
    cb.set_label("Reliability ↑")
    ax2.grid(True, alpha=0.3)

    # ---- 3. Correlation heatmap ----
    ax3 = fig.add_subplot(2, 2, 3)
    corr = df[cols].corr()
    im = ax3.imshow(corr, cmap="coolwarm", vmin=-1, vmax=1)
    ax3.set_xticks(range(len(labels)))
    ax3.set_yticks(range(len(labels)))
    ax3.set_xticklabels(labels, rotation=30, ha="right", fontsize=8)
    ax3.set_yticklabels(labels, fontsize=8)
    for i in range(len(cols)):
        for j in range(len(cols)):
            ax3.text(j, i, f"{corr.iloc[i, j]:.2f}", ha="center", va="center", fontsize=8)
    ax3.set_title("Objective correlation")
    fig.colorbar(im, ax=ax3, fraction=0.046)

    # ---- 4. 3D projection ----
    ax4 = fig.add_subplot(2, 2, 4, projection="3d")
    ax4.scatter(
        df["vehicles_used"],
        df["distance"],
        df["reliability"],
        c=df["waiting_time"],
        cmap="plasma",
        s=35,
    )
    ax4.set_xlabel("Vehicles ↓")
    ax4.set_ylabel("Distance ↓")
    ax4.set_zlabel("Reliability ↑")
    ax4.set_title("3D projection (color=Waiting↓)")

    fig.tight_layout(rect=[0, 0, 1, 0.95])
    fig.savefig(out_path, dpi=140)
    plt.close(fig)
    print(f"Saved Pareto visualization → {out_path}")
    return out_path


def save_pareto_csv(solutions, out_path="results/pareto_solutions.csv"):
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    df = solutions_to_dataframe(solutions)
    # Also store route summary length
    route_lens = []
    for s in solutions:
        route_lens.append(
            ";".join(str(len(r)) for r in s["routes"] if r)
        )
    df["nonempty_route_lengths"] = route_lens
    df.to_csv(out_path, index=False)
    print(f"Saved Pareto solutions CSV → {out_path}")
    return df
