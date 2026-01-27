from fastapi import APIRouter
from pydantic import BaseModel, Field
import random

from app.fec.hamming74 import encode_bits, decode_bits

router = APIRouter(tags=["simulation"])


class SimRequest(BaseModel):
    frames: int = Field(20, ge=1, le=500)
    bit_flip_prob: float = Field(0.01, ge=0.0, le=0.5)
    bits_per_frame: int = Field(64, ge=16, le=1024)
    use_fec: bool = Field(True)


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


@router.post("/simulate")
def simulate(req: SimRequest):
    # --- Uncoded metrics ---
    uncoded_frame_success = 0
    uncoded_total_ber = 0.0
    uncoded_heartbeat = []

    # --- Coded metrics (Hamming 7,4) ---
    coded_frame_success = 0
    coded_total_ber = 0.0
    coded_heartbeat = []
    corrected_codewords_total = 0

    flipped_bits_total = 0

    # Preview (short) for UI
    preview_original = None
    preview_received_uncoded = None
    preview_received_coded = None

    # Sample (full frame) for optional UI/debug
    sample_original = None
    sample_noisy_uncoded = None
    sample_decoded_coded = None
    sample_noisy_coded_preview = None

    for f in range(req.frames):
        original = [random.randint(0, 1) for _ in range(req.bits_per_frame)]

        # ---------- Uncoded path ----------
        received_uncoded, flips_u = apply_bitflip_noise(original, req.bit_flip_prob)
        flipped_bits_total += flips_u

        is_perfect_uncoded = (original == received_uncoded)
        uncoded_heartbeat.append(1 if is_perfect_uncoded else 0)
        if is_perfect_uncoded:
            uncoded_frame_success += 1

        uncoded_total_ber += ber(original, received_uncoded)

        # ---------- Coded path ----------
        decoded = None
        noisy_coded = None

        if req.use_fec:
            coded = encode_bits(original)
            noisy_coded, flips_c = apply_bitflip_noise(coded, req.bit_flip_prob)
            flipped_bits_total += flips_c

            decoded, corrected_codewords = decode_bits(noisy_coded)
            corrected_codewords_total += corrected_codewords

            decoded = decoded[:req.bits_per_frame]

            is_perfect_coded = (original == decoded)
            coded_heartbeat.append(1 if is_perfect_coded else 0)
            if is_perfect_coded:
                coded_frame_success += 1

            coded_total_ber += ber(original, decoded)

        # Store previews/samples only for first frame
        if f == 0:
            preview_original = original[:128]
            preview_received_uncoded = received_uncoded[:128]
            preview_received_coded = decoded[:128] if (req.use_fec and decoded is not None) else None

            sample_original = original
            sample_noisy_uncoded = received_uncoded
            sample_decoded_coded = decoded
            sample_noisy_coded_preview = noisy_coded[:120] if (req.use_fec and noisy_coded is not None) else None

    payload = {
        "__version": "SIM_V2_HEARTBEAT",
        "params": req.model_dump(),
        "preview": {
            "original_bits": preview_original,
            "received_uncoded_bits": preview_received_uncoded,
            "received_coded_bits": preview_received_coded,
            "preview_bits": 128,
        },
        "metrics": {
            "flipped_bits_total": flipped_bits_total,
            "uncoded": {
                "avg_ber": round(uncoded_total_ber / req.frames, 6),
                "frame_success": uncoded_frame_success,
                "frame_success_rate": round(uncoded_frame_success / req.frames, 4),
                "heartbeat": uncoded_heartbeat,
            },
        },
        "sample": {
            "original_frame_0": sample_original,
            "noisy_uncoded_frame_0": sample_noisy_uncoded,
            "noisy_coded_bits_0_preview": sample_noisy_coded_preview,
            "decoded_coded_frame_0": sample_decoded_coded,
        },
    }

    if req.use_fec:
        payload["metrics"]["coded_hamming74"] = {
            "avg_ber": round(coded_total_ber / req.frames, 6),
            "frame_success": coded_frame_success,
            "frame_success_rate": round(coded_frame_success / req.frames, 4),
            "corrected_codewords": corrected_codewords_total,
            "heartbeat": coded_heartbeat,
        }

    return payload
