const ADJECTIVES = [
	"brave",
	"calm",
	"eager",
	"fancy",
	"gentle",
	"jolly",
	"kind",
	"lively",
	"merry",
	"nice",
] as const;

const ANIMALS = [
	"panda",
	"tiger",
	"otter",
	"eagle",
	"koala",
	"lion",
	"dolphin",
	"fox",
	"wolf",
	"owl",
] as const;

export const randomUsername = (seed: string): string => {
	let h = 0;
	for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
	const adj = ADJECTIVES[h % ADJECTIVES.length];
	const ani = ANIMALS[((h >> 5) >>> 0) % ANIMALS.length];
	const num = (h % 1000).toString().padStart(3, "0");
	return `${adj}-${ani}-${num}`;
};

export const avatarColorFromUserId = (seed: string): string => {
	let h = 0;
	for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
	const hue = h % 360;
	const sat = 65 + (h % 10); // vary saturation slightly
	const light = 50 + (h % 5); // vary lightness slightly
	return `hsl(${hue}deg ${sat}% ${light}%)`;
};
