#!/bin/zsh
# Rebuilds every file in ../media from the original shoots and renders.
set -e
cd "${0:A:h}/.."
OUT=public/media; mkdir -p $OUT/stills $OUT/clips $OUT/rota
K=~/Desktop/Kajiji
q() { ffmpeg -loglevel error -y "$@"; }

# Stills
i=0
for f in "$K/21-10.  lm/IMGL1196.JPG" "$K/21-10.  lm/IMGL1201.JPG" "$K/21-10.  lm/IMGL1206.JPG" \
         "$K/21-10.  lm/IMGL1210.JPG" "$K/21-10.  lm/IMGL1212.JPG" "$K/21-10.  lm/IMGL1213.JPG" \
         "$K/LM RING POST 18.10/IMGL1282.JPG" "$K/LM RING POST 18.10/IMGL1289.JPG" "$K/LM RING POST 18.10/IMGL1290.JPG" \
         "$K/LM RING POST 18.10/IMGL1291.JPG" "$K/LM RING POST 18.10/IMGL1293.JPG" "$K/LM RING POST 18.10/IMGL1297.JPG"; do
  n=$(printf "%02d" $i)
  q -i "$f" -vf "scale=-2:2000" -q:v 4 $OUT/stills/$n.jpg
  i=$((i+1))
done

# Clips: 3 s of 50 fps source slowed to 6 s at 25 fps, short GOP so hover-skimming seeks fast
clip() { q -ss $3 -t 3 -i "$1" -an -vf "setpts=2*PTS,scale=1280:-2,fps=25" -c:v libx264 -crf 25 -g 5 -pix_fmt yuv420p -movflags +faststart $OUT/clips/$2.mp4
         q -ss $(($3+1)) -i "$1" -frames:v 1 -vf scale=1280:-2 -q:v 5 $OUT/clips/$2.jpg; }
clip "$K/GEMONE insta _ EARRINGS - 2. 27.10/IMG_1469.MP4" stack 2
clip "$K/earrings with same concetpt/IMG_1352.MP4" ear 3
clip "$K/3 Outfit/IMG_1171.MP4" pendant 2
clip "$K/12-10-2026/IMG_1525.MP4" studs 2

q -i ~/paper-puja/out/PaperPuja_v2.mp4 -vf scale=720:-2 -c:v libx264 -crf 26 -g 12 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart $OUT/clips/puja.mp4
q -ss 8 -i ~/paper-puja/out/PaperPuja_v2.mp4 -frames:v 1 -vf scale=720:-2 -q:v 5 $OUT/clips/puja.jpg
q -i ~/Projects/bloom/media/bloom.mp4 -an -c:v libx264 -crf 26 -g 12 -pix_fmt yuv420p -movflags +faststart $OUT/clips/bloom.mp4
q -ss 3 -i ~/Projects/bloom/media/bloom.mp4 -frames:v 1 -q:v 5 $OUT/clips/bloom.jpg
D=~/Desktop/"Krishna /Creative Assets/3D art/Dragon/renders"
for r in hero wings head maw menace; do q -i "$D/v2_$r.png" -vf scale=1280:-2 -q:v 4 $OUT/clips/dragon-$r.jpg; done

cp ~/rota-brand/ROTA_brand_sheet.png $OUT/rota/sheet.png
cp ~/rota-logo-in-the-wild/ROTA_logo_stinger.mp4 $OUT/rota/stinger.mp4
du -sh $OUT/*
