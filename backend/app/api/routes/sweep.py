from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List
import random

from app.fec.hamming74 import encode_bits, decode_bits

router = APIRouter(tags=["experiments"])


class SweepRequest(BaseModel):
    frames: int = Field(100, ge=10, le=1000)
    bits_per_frame: int = Field(64, ge=16, le=1024)
    use_fec: bool = True
    noise_values: List[float] = Field(default_factory=lambda: [round(x, 3) for x in [i * 0.01 for i in range(0, 21)]])


def apply_bitflip_noise(bits, p):
    noisy = []
    flips = 0
    for b in bits:
        if random.random() < p:
            noisy.append(1 - b)
            flips += 1
        else:
            noisy.append(b)
    return noisy, flips


def ber(a, b):
    n = min(len(a), len(b))
    if n == 0:
        return 0.0
    err = sum(1 for i in range(n) if a[i] != b[i])
    return err / n


@router.post("/sweep")
def sweep(req: SweepRequest):
    results = []

    for p in req.noise_values:
        uncoded_frame_success = 0
        uncoded_total_ber = 0.0

        coded_frame_success = 0
        coded_total_ber = 0.0
        corrected_codewords_total = 0

        for _ in range(req.frames):
            original = [random.randint(0, 1) for _ in range(req.bits_per_frame)]

            # Uncoded
            rx_u, _ = apply_bitflip_noise(original, p)
            if rx_u == original:
                uncoded_frame_success += 1
            uncoded_total_ber += ber(original, rx_u)

            # Coded (optional)
            if req.use_fec:
                coded = encode_bits(original)
                rx_c, _ = apply_bitflip_noise(coded, p)
                decoded, corrected = decode_bits(rx_c)
                corrected_codewords_total += corrected
                decoded = decoded[: req.bits_per_frame]

                if decoded == original:
                    coded_frame_success += 1
                coded_total_ber += ber(original, decoded)

        row = {
            "noise": p,
            "uncoded": {
                "avg_ber": round(uncoded_total_ber / req.frames, 6),
                "frame_success_rate": round(uncoded_frame_success / req.frames, 4),
            },
        }

        if req.use_fec:
            row["coded_hamming74"] = {
                "avg_ber": round(coded_total_ber / req.frames, 6),
                "frame_success_rate": round(coded_frame_success / req.frames, 4),
                "corrected_codewords": corrected_codewords_total,
            }

        results.append(row)

    return {
        "__version": "SWEEP_V1",
        "params": req.model_dump(),
        "results": results,
    }
