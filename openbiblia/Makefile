start:
	npx expo start

dev:
	eas build --platform android --profile dev

build-apk
	eas build --platform android --profile preview

prebuild:
	npx expo prebuild --clean

build-local: prebuild
	cd android && ./gradlew assembleRelease