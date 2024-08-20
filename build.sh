#!/bin/bash

# Generate static content, independent on language

mkdir -p ./dist_static &&
rm -rf ./dist_static/* &&

npm run build-only-static &&

cp -r ./out/* ./dist_static &&

# Generate dynamic content, for each language file

mkdir -p ./dist &&
rm -rf ./dist/* || exit 1

for entry in ./src/translation/*
do
	base=$(basename "$entry" .yaml)

	cp "$entry" ./src/data/translation.yaml

	npm run build-only-dynamic &&

	mkdir -p "./dist/$base" &&
	rm -rf "./dist/$base/*" &&
	cp -r ./out/* "./dist/$base" &&
	cp -r ./dist_static/* "./dist/$base" || exit 1
done

# Done

echo "Successfully built, cleaning ..."

# Clean up

rm -rf ./out &&
rm -rf ./dist_static &&

echo "Successfully cleaned!" || exit 1