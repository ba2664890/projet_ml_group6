import json
from pathlib import Path

import numpy as np
import pandas as pd


def generate_stats():
    raw_data_path = Path("data/raw/train.csv")
    output_path = Path("data/processed/stats.json")

    if not raw_data_path.exists():
        print(f"Error: {raw_data_path} not found.")
        return

    df = pd.read_csv(raw_data_path)

    # Overview stats
    stats = {
        "overview": {
            "total_properties": len(df),
            "avg_price": float(df["SalePrice"].mean()),
            "median_price": float(df["SalePrice"].median()),
            "min_price": float(df["SalePrice"].min()),
            "max_price": float(df["SalePrice"].max()),
            "price_std": float(df["SalePrice"].std()),
        },
        "neighborhoods": [],
    }

    # Neighborhood stats
    nb_stats = df.groupby("Neighborhood")["SalePrice"].agg(["mean", "median", "count", "min", "max"]).reset_index()
    for _, row in nb_stats.iterrows():
        stats["neighborhoods"].append(
            {
                "Neighborhood": row["Neighborhood"],
                "avg_price": float(row["mean"]),
                "median_price": float(row["median"]),
                "property_count": int(row["count"]),
                "min_price": float(row["min"]),
                "max_price": float(row["max"]),
            }
        )

    # Price distribution
    counts, bin_edges = np.histogram(df["SalePrice"], bins=20)
    stats["distribution"] = {
        "labels": [f"{int(bin_edges[i]/1000)}k-{int(bin_edges[i+1]/1000)}k" for i in range(len(counts))],
        "values": counts.tolist(),
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(stats, f, indent=4)

    print(f"Stats generated at {output_path}")


if __name__ == "__main__":
    generate_stats()
