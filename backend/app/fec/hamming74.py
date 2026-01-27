def encode_nibble(d):
    """
    d: list of 4 bits [d1,d2,d3,d4]
    returns 7-bit codeword [p1,p2,d1,p3,d2,d3,d4]
    """
    d1, d2, d3, d4 = d
    p1 = d1 ^ d2 ^ d4
    p2 = d1 ^ d3 ^ d4
    p3 = d2 ^ d3 ^ d4
    return [p1, p2, d1, p3, d2, d3, d4]


def decode_codeword(c):
    """
    c: list of 7 bits [p1,p2,d1,p3,d2,d3,d4]
    returns corrected 4-bit data [d1,d2,d3,d4] and a flag if corrected
    """
    p1, p2, d1, p3, d2, d3, d4 = c

    s1 = p1 ^ d1 ^ d2 ^ d4
    s2 = p2 ^ d1 ^ d3 ^ d4
    s3 = p3 ^ d2 ^ d3 ^ d4

    # syndrome -> error position (1-indexed)
    err_pos = s1 * 1 + s2 * 2 + s3 * 4

    corrected = False
    if err_pos != 0:
        corrected = True
        idx = err_pos - 1
        c[idx] ^= 1

    # extract data bits after potential correction
    _, _, d1, _, d2, d3, d4 = c
    return [d1, d2, d3, d4], corrected


def encode_bits(bits):
    """Encode list of bits using Hamming(7,4). Pads to multiple of 4."""
    bits = bits[:]
    while len(bits) % 4 != 0:
        bits.append(0)

    out = []
    for i in range(0, len(bits), 4):
        out.extend(encode_nibble(bits[i:i+4]))
    return out


def decode_bits(bits):
    """Decode list of bits using Hamming(7,4). Truncates to multiple of 7."""
    n = (len(bits) // 7) * 7
    bits = bits[:n]

    out = []
    corrected_count = 0
    for i in range(0, len(bits), 7):
        data, corrected = decode_codeword(bits[i:i+7])
        out.extend(data)
        if corrected:
            corrected_count += 1
    return out, corrected_count