import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ngos = [
  { id: "ngo-01", name: "Harborlight Relief Network", country: "Jordan", verified: true },
  { id: "ngo-02", name: "Cedar Path Aid", country: "Lebanon", verified: true },
  { id: "ngo-03", name: "Open Hands Community Fund", country: "Uganda", verified: true },
  { id: "ngo-04", name: "New Dawn Support Collective", country: "Kenya", verified: true },
  { id: "ngo-05", name: "Olive Branch Mutual Aid", country: "Türkiye", verified: true },
  { id: "ngo-06", name: "Bridgeway Family Services", country: "Iraq", verified: true },
  { id: "ngo-unverified", name: "New Horizons Aid Group", country: "Sudan", verified: false },
];

const givenNames = [
  "Amira", "Samir", "Lina", "Omar", "Nadia", "Yusuf", "Mariam", "Rami",
  "Hana", "Tariq", "Leila", "Khalil", "Salma", "Adnan", "Noor", "Faris",
  "Dalia", "Zayd", "Rana", "Mahmoud",
];
const familyNames = [
  "Nasser", "Haddad", "Rahim", "Darwish", "Khatib", "Mansour", "Saleh", "Karim",
  "Farouk", "Qasim", "Aziz", "Jaber", "Hamdan", "Shami", "Najjar", "Younes",
];

const needsByCategory = {
  FOOD: [
    { item: "Rice and lentil family pack", costAed: 48, stockLeft: 12, dailyUse: 1 },
    { item: "Infant nutrition tins", costAed: 76, stockLeft: 5, dailyUse: 1 },
    { item: "Cooking oil and staples kit", costAed: 63, stockLeft: 9, dailyUse: 1 },
  ],
  MEDICINE: [
    { item: "Basic first-aid refill kit", costAed: 92, stockLeft: 4, dailyUse: 1 },
    { item: "Child fever care pack", costAed: 55, stockLeft: 7, dailyUse: 1 },
    { item: "Monthly chronic-care supply", costAed: 185, stockLeft: 2, dailyUse: 1 },
  ],
  SHELTER: [
    { item: "Weatherproof family blanket", costAed: 110, stockLeft: 3, dailyUse: 1 },
    { item: "Insulated sleeping mat", costAed: 135, stockLeft: 4, dailyUse: 1 },
    { item: "Emergency shelter repair kit", costAed: 240, stockLeft: 1, dailyUse: 1 },
  ],
} as const;

async function seed() {
  for (const ngo of ngos) {
    await prisma.ngo.upsert({
      where: { id: ngo.id },
      update: ngo,
      create: ngo,
    });
  }

  for (let index = 0; index < 80; index += 1) {
    const number = index + 1;
    const ngo = ngos[index % 6];
    const refugeeId = `refugee-${String(number).padStart(3, "0")}`;
    const refugee = await prisma.refugee.upsert({
      where: { id: refugeeId },
      update: {
        ngoId: ngo.id,
        name: `${givenNames[index % givenNames.length]} ${familyNames[Math.floor(index / 5) % familyNames.length]}`,
        age: 4 + ((index * 7) % 66),
        gender: ["Female", "Male", "Non-binary"][index % 3],
      },
      create: {
        id: refugeeId,
        ngoId: ngo.id,
        name: `${givenNames[index % givenNames.length]} ${familyNames[Math.floor(index / 5) % familyNames.length]}`,
        age: 4 + ((index * 7) % 66),
        gender: ["Female", "Male", "Non-binary"][index % 3],
        externalId: `RB-FIC-${String(number).padStart(3, "0")}`,
      },
    });

    const standardNeedCount = (index % 3) + 1;
    const anomalyNeedCount = index % 6 === 5 ? 3 : 0;
    for (let needIndex = 0; needIndex < standardNeedCount + anomalyNeedCount; needIndex += 1) {
      const category = (["FOOD", "MEDICINE", "SHELTER"] as const)[
        (index + needIndex) % 3
      ];
      const options = needsByCategory[category];
      const option = options[(index + needIndex) % options.length];
      const anomalyLabel = needIndex >= standardNeedCount ? "Priority review" : "";
      await prisma.need.upsert({
        where: { id: `need-${String(number).padStart(3, "0")}-${needIndex + 1}` },
        update: {
          refugeeId: refugee.id,
          category,
          item: anomalyLabel ? `${anomalyLabel}: ${option.item}` : option.item,
          costAed: option.costAed + ((index % 5) * 3),
          stockLeft: Math.max(1, option.stockLeft - (index % 4)),
          dailyUse: option.dailyUse + (index % 2),
        },
        create: {
          id: `need-${String(number).padStart(3, "0")}-${needIndex + 1}`,
          refugeeId: refugee.id,
          category,
          item: anomalyLabel ? `${anomalyLabel}: ${option.item}` : option.item,
          costAed: option.costAed + ((index % 5) * 3),
          stockLeft: Math.max(1, option.stockLeft - (index % 4)),
          dailyUse: option.dailyUse + (index % 2),
        },
      });
    }
  }

  for (let index = 0; index < 6; index += 1) {
    const donorId = `donor-${String(index + 1).padStart(2, "0")}`;
    const name = [
      "Maya Ellis", "Rafiq Rahman", "Elena Brooks", "Jonah Clarke", "Sana Mir",
      "Drew Morgan",
    ][index];
    await prisma.donor.upsert({
      where: { email: `supporter${index + 1}@example.test` },
      update: { name },
      create: { id: donorId, name, email: `supporter${index + 1}@example.test` },
    });
  }

  for (let index = 0; index < 60; index += 1) {
    const donorNumber = (index % 6) + 1;
    const createdAt = new Date(
      Date.now() -
        ((index * 11) % 30) * 86_400_000 -
        ((index * 37) % 24) * 3_600_000,
    );
    await prisma.donation.upsert({
      where: { id: `donation-${String(index + 1).padStart(3, "0")}` },
      update: {
        donorId: `donor-${String(donorNumber).padStart(2, "0")}`,
        amountAed: 10 + ((index * 173) % 991),
        status: index % 3 === 0 ? "DISTRIBUTED" : "PENDING",
        createdAt,
      },
      create: {
        id: `donation-${String(index + 1).padStart(3, "0")}`,
        donorId: `donor-${String(donorNumber).padStart(2, "0")}`,
        amountAed: 10 + ((index * 173) % 991),
        status: index % 3 === 0 ? "DISTRIBUTED" : "PENDING",
        createdAt,
      },
    });
  }

  await prisma.fraudFlag.upsert({
    where: { id: "flag-unusual-needs" },
    update: {
      ngoId: "ngo-06",
      type: "UNUSUAL_PATTERN",
      note: "Several extra priority needs were submitted for review by this NGO.",
    },
    create: {
      id: "flag-unusual-needs",
      ngoId: "ngo-06",
      type: "UNUSUAL_PATTERN",
      note: "Several extra priority needs were submitted for review by this NGO.",
    },
  });
  await prisma.fraudFlag.upsert({
    where: { id: "flag-unverified-ngo" },
    update: {
      ngoId: "ngo-unverified",
      type: "UNUSUAL_PATTERN",
      note: "This organization has not completed partner verification.",
    },
    create: {
      id: "flag-unverified-ngo",
      ngoId: "ngo-unverified",
      type: "UNUSUAL_PATTERN",
      note: "This organization has not completed partner verification.",
    },
  });

  console.log("Seed complete: 7 NGOs, 80 fictional refugees, sample needs, donors and 60 donations.");
}

seed()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
