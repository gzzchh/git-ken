function patchSnapshot() {
	snapshotResult.customRequire.cache["@axosoft/edm-d/src/d.js"] = {
		exports: () =>
			Promise.resolve({
				expiresAt: 8640000000000000,
				quantity: Number.MAX_SAFE_INTEGER,
				subscriber: { name: "MisakaCloud" },
			}),
	};
}

module.exports = {
	patchSnapshot,
};
