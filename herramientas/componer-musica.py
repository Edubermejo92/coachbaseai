"""Pista original de los vídeos de CoachBase (public/musica/coachbase-intro.mp3):
124 BPM, La menor (Am - F - C - G), 1 compás de subida y 19 de tema con
bombo a negras, palmas en 2 y 4, bajo a contratiempo, pad con bombeo,
arpegio y melodía. Todo sintetizado aquí (sin muestras ni música de
terceros, así que no hay derechos que pagar) y en bucle perfecto: la
reverberación y los ecos se pliegan al principio.

    python3 herramientas/componer-musica.py pista.wav
    ffmpeg -i pista.wav -af volume=-1.4dB -c:a libmp3lame -b:a 128k \\
        public/musica/coachbase-intro.mp3        # ≈ -14,7 LUFS
"""
import sys, wave
import numpy as np

SR = 44100
BPM = 124
BEAT = 60 / BPM
BAR = 4 * BEAT
NBARS = 20
N = int(round(NBARS * BAR * SR))
rng = np.random.default_rng(7)

GRUPOS = {}
REV_L = np.zeros(N)
REV_R = np.zeros(N)


def grupo(nombre):
    if nombre not in GRUPOS:
        GRUPOS[nombre] = (np.zeros(N), np.zeros(N))
    return GRUPOS[nombre]


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def poner(buf, señal, t0):
    """Suma `señal` en buf desde t0 (s), dando la vuelta al final (bucle)."""
    i0 = int(round(t0 * SR)) % N
    n = len(señal)
    fin = i0 + n
    if fin <= N:
        buf[i0:fin] += señal
    else:
        k = N - i0
        buf[i0:] += señal[:k]
        resto = señal[k:]
        while len(resto):
            m = min(len(resto), N)
            buf[:m] += resto[:m]
            resto = resto[m:]


# Ganancias por grupo (dB), medidas en RMS: sin ellas el bombo quedaba 27 dB
# por encima del arpegio y en el altavoz de un móvil solo se oía el golpe.
GAN = {"bombo": -7.8, "bajo": 2.4, "palmas": 5.5, "charles": -1.3, "pad": 3.4,
       "arpegio": 12.4, "melodia": 12.9, "fx": 2.0}


def poner2(sig, t0, pan=0.0, rev=0.0, grp="fx"):
    sig = sig * 10 ** (GAN[grp] / 20)
    gl = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
    gr = np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
    L, R = grupo(grp)
    poner(L, sig * gl, t0)
    poner(R, sig * gr, t0)
    if rev:
        poner(REV_L, sig * gl * rev, t0)
        poner(REV_R, sig * gr * rev, t0)


def saw(f, t, nh=12, caida=6.0, fase=0.0):
    out = np.zeros_like(t)
    for k in range(1, nh + 1):
        if f * k > SR * 0.45:
            break
        out += np.sin(2 * np.pi * f * k * t + fase * k) * (1 / k) * np.exp(-(k - 1) / caida)
    return out


def tri(f, t, nh=9):
    out = np.zeros_like(t)
    s = 1
    for k in range(1, nh + 1, 2):
        if f * k > SR * 0.45:
            break
        out += s * np.sin(2 * np.pi * f * k * t) / (k * k)
        s = -s
    return out


def env(n, a, d, s, r_len, total):
    """ADSR en muestras: a, d, r en segundos; s nivel; total = duración de la nota."""
    t = np.arange(n) / SR
    e = np.ones(n) * s
    a = max(a, 1e-4)
    e = np.where(t < a, t / a, e)
    e = np.where((t >= a) & (t < a + d), 1 - (1 - s) * (t - a) / max(d, 1e-4), e)
    e = np.where(t >= total, s * np.exp(-(t - total) / max(r_len, 1e-4) * 4), e)
    return e


def hp(x):
    return np.diff(x, prepend=0.0)


def lp(x, n=3):
    k = np.ones(n) / n
    return np.convolve(x, k, mode="same")


# ---------- percusión ----------
def bombo():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 46 + 120 * np.exp(-t / 0.032)
    fase = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(fase) * np.exp(-t / 0.30)
    click = rng.standard_normal(n) * np.exp(-t / 0.0015) * 0.35
    return np.tanh(1.8 * (s + click)) * 0.95


def palmas():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    ruido = lp(hp(rng.standard_normal(n)), 4)
    e = np.zeros(n)
    for d in (0.0, 0.009, 0.018):
        e += np.where(t >= d, np.exp(-(t - d) / 0.006), 0) * 0.6
    e += np.where(t >= 0.025, np.exp(-(t - 0.025) / 0.10), 0)
    return ruido * e * 0.55


def charles(largo=0.03):
    n = int((largo * 6) * SR)
    t = np.arange(n) / SR
    r = lp(hp(hp(rng.standard_normal(n))), 2)
    return r * np.exp(-t / largo) * 0.12


def platillo():
    n = int(2.2 * SR)
    t = np.arange(n) / SR
    r = hp(hp(rng.standard_normal(n)))
    return r * np.exp(-t / 0.7) * 0.10


B = bombo()
P = palmas()
CH = charles(0.022)
OH = charles(0.09)
CR = platillo()

# ---------- armonía ----------
ACORDES = [  # (raíz del bajo, notas del pad, notas del arpegio)
    (45, [57, 60, 64], [69, 72, 76, 81]),   # Am
    (41, [57, 60, 65], [65, 69, 72, 77]),   # F
    (48, [55, 60, 64], [67, 72, 76, 79]),   # C
    (43, [55, 59, 62], [67, 71, 74, 79]),   # G
]
MELODIA = [  # por acorde: (corchea, nota) en el compás
    [(0, 69), (1, 72), (2, 76), (4, 76), (5, 74), (6, 72)],
    [(0, 72), (2, 69), (6, 72), (7, 74)],
    [(0, 76), (2, 79), (4, 76), (5, 74), (6, 72)],
    [(0, 74), (2, 71), (4, 67)],
]


def bombeo(t_abs):
    """Ganancia de sidechain: se agacha con cada bombo (a negras)."""
    fase = np.mod(t_abs, BEAT)
    return 1 - 0.62 * np.exp(-fase / 0.11)


for barra in range(NBARS):
    t0 = barra * BAR
    raiz, pad, arp = ACORDES[barra % 4]
    intro = barra == 0
    seccion_b = 9 <= barra <= 16

    # --- percusión ---
    if intro:
        # redoble de palmas que acelera
        golpes = [0, 0.5, 1, 1.5] + [2 + i * 0.25 for i in range(8)]   # en pulsos
        for i, g in enumerate(golpes):
            vel = 0.25 + 0.75 * (i / len(golpes))
            poner2(P * vel * 0.7, t0 + g * BEAT, pan=0.0, rev=0.25, grp="palmas")
        # subida de ruido
        n = int(BAR * SR)
        t = np.arange(n) / SR
        r = hp(rng.standard_normal(n)) * (t / BAR) ** 2 * 0.22
        poner2(r, t0, rev=0.3)
        sw = np.sin(2 * np.pi * np.cumsum(220 + 900 * (t / BAR) ** 2) / SR) * (t / BAR) ** 3 * 0.08
        poner2(sw, t0, rev=0.2)
    else:
        for b in range(4):
            poner2(B, t0 + b * BEAT, grp="bombo")
            poner2(OH, t0 + b * BEAT + BEAT / 2, pan=0.25, grp="charles")
            for s in range(4):
                if s != 2:
                    poner2(CH * (0.8 if s % 2 else 0.5), t0 + b * BEAT + s * BEAT / 4, pan=-0.3, grp="charles")
        for b in (1, 3):
            poner2(P, t0 + b * BEAT, rev=0.18, grp="palmas")
        if barra in (1, 9, 17):
            poner2(CR, t0, pan=0.1, rev=0.2, grp="charles")
        if barra % 4 == 0 and barra not in (1,):
            poner2(CR * 0.5, t0, pan=-0.1, rev=0.2, grp="charles")

    # --- bajo a contratiempo ---
    if not intro:
        for b in range(4):
            n = int(BEAT / 2 * 0.95 * SR)
            t = np.arange(n) / SR
            f = midi(raiz)
            s = saw(f, t, nh=14, caida=4) * 0.9 + np.sin(2 * np.pi * f / 2 * t) * 0.5
            s *= env(n, 0.004, 0.08, 0.6, 0.02, n / SR - 0.02)
            poner2(np.tanh(1.4 * s) * 0.32, t0 + b * BEAT + BEAT / 2, grp="bajo")

    # --- pad (con bombeo) ---
    n = int((BAR + 0.25) * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for nota in pad:
        for det, ph in ((-0.07, 0.3), (0.0, 1.1), (0.07, 2.0)):
            f = midi(nota) * 2 ** (det / 12)
            s += saw(f, t, nh=8, caida=3, fase=ph)
    e = env(n, 0.03 if not intro else BAR * 0.8, 0.2, 0.8, 0.25, BAR)
    s = s * e * (0.05 if not intro else 0.035) * 10 ** (GAN["pad"] / 20)
    if not intro:
        s *= bombeo(t)
    # algo de anchura: el pad un poco distinto a cada lado
    pl, pr = grupo("pad")
    poner(pl, s, t0)
    poner(pr, np.roll(s, int(0.011 * SR)), t0)
    poner(REV_L, s * 0.5, t0)
    poner(REV_R, s * 0.5, t0)

    # --- arpegio a semicorcheas ---
    if not intro:
        patron = [0, 1, 2, 3, 2, 1, 2, 3]
        for i in range(16):
            nota = arp[patron[i % 8]]
            n = int(0.22 * SR)
            t = np.arange(n) / SR
            f = midi(nota)
            s = (tri(f, t) * 0.8 + saw(f, t, nh=6, caida=2) * 0.25) * np.exp(-t / 0.075)
            vel = 0.75 if i % 4 == 0 else 0.55
            ti = t0 + i * BEAT / 4
            g = 0.075 * vel * (1.0 if not seccion_b else 0.8)
            poner2(s * g, ti, pan=-0.35, rev=0.25, grp="arpegio")
            poner2(s * g * 0.45, ti + 3 * BEAT / 4, pan=0.5, rev=0.25, grp="arpegio")   # eco a 3/16

    # --- melodía (segunda parte) ---
    if seccion_b:
        for (corchea, nota) in MELODIA[barra % 4]:
            dur = BEAT / 2 * 0.9
            n = int((dur + 0.15) * SR)
            t = np.arange(n) / SR
            f = midi(nota) * 2 ** ((10 / 1200) * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.08) / 0.1, 0, 1))
            fase = 2 * np.pi * np.cumsum(f) / SR
            s = np.zeros(n)
            for k in range(1, 14):
                s += np.sin(k * fase) / k * np.exp(-(k - 1) / 5)
            s *= env(n, 0.008, 0.1, 0.75, 0.08, dur)
            poner2(s * 0.085, t0 + corchea * BEAT / 2, pan=0.1, rev=0.35, grp="melodia")
            poner2(s * 0.03, t0 + corchea * BEAT / 2 + 3 * BEAT / 4, pan=-0.5, rev=0.3, grp="melodia")

# ---------- reverberación circular (bucle perfecto) ----------
nir = int(1.6 * SR)
tir = np.arange(nir) / SR


def ir():
    r = rng.standard_normal(nir) * np.exp(-tir / 0.45)
    r = lp(r, 6)
    r[: int(0.012 * SR)] = 0
    return r / np.sqrt(np.sum(r ** 2)) * 0.9


def circ(x, h):
    H = np.fft.rfft(np.concatenate([h, np.zeros(N - len(h))]))
    return np.fft.irfft(np.fft.rfft(x) * H, n=N)


# Ganancias por grupo (dB), pensadas para que en el altavoz de un móvil se
# oigan bajo, acordes y melodía, y no solo el bombo.
for k, (gl, gr) in GRUPOS.items():
    print(f"  {k:8s} rms {20*np.log10(np.sqrt(np.mean(gl**2))+1e-12):6.1f} dB")
L = sum(GRUPOS[k][0] for k in GRUPOS)
R = sum(GRUPOS[k][1] for k in GRUPOS)
L += circ(REV_L, ir())
R += circ(REV_R, ir())

# ---------- master ----------
mezcla = np.stack([L, R], axis=1)
mezcla -= mezcla.mean(axis=0)
pico = np.max(np.abs(mezcla))
mezcla = mezcla / pico * 1.1
mezcla = np.tanh(mezcla) / np.tanh(1.1)
mezcla *= 10 ** (-1.0 / 20)
print("pico", np.max(np.abs(mezcla)), "rms", np.sqrt(np.mean(mezcla ** 2)), "dur", N / SR)

pcm = (mezcla * 32767).astype("<i2")
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
