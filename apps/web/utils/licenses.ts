export interface License {
  value: string
  label: string
  description: string
}

export const licenses: License[] = [
  {
    value: "mit",
    label: "MIT License",
    description:
      "Allows free use, modification, and distribution. Requires copyright notice.",
  },
  {
    value: "apache-2.0",
    label: "Apache License 2.0",
    description:
      "Permits use and distribution. Grants patent rights. Requires attribution.",
  },
  {
    value: "bsd-3-clause",
    label: "BSD 3-Clause License",
    description:
      "Allows use and redistribution. Prohibits using contributors' names for promotion.",
  },
  {
    value: "lgpl",
    label: "GNU Lesser General Public License (LGPL)",
    description:
      "Permits linking with non-LGPL software. Requires source code for LGPL parts.",
  },
  {
    value: "mpl-2.0",
    label: "Mozilla Public License 2.0 (MPL)",
    description:
      "Allows integration with proprietary software. Requires sharing modifications to MPL code.",
  },
  {
    value: "isc",
    label: "ISC License",
    description:
      "Similar to MIT. Allows use, modification, and distribution with minimal restrictions.",
  },
  {
    value: "no-license",
    label: "No License",
    description:
      "Releases software into the public domain. No restrictions on use or distribution.",
  },
]

export const getLicenseBySlug = (slug: string): License | undefined => {
  return licenses.find((license) => license.value === slug)
}
