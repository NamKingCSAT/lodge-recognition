export type DistrictPosition = {
  title: string;
  status: "current" | "past";
  startYear?: number;
  endYear?: number;
};

export type Member = {
  id: string;
  name: string;
  photo?: string;

  // Lodge where the brother served as Worshipful Master
  lodge: string;

  // All years served as Worshipful Master
  pastMasterYears: number[];

  // District offices held
  districtPositions: DistrictPosition[];

  // Current office within his lodge, if applicable
  currentLodgeOffice?: string;

  // Honorific, e.g. W.B. or R.W.B.
  honorific?: string;

  notes?: string;
};

export const members: Member[] = [
  // ==========================================
  // FOREST CITY LODGE PAST MASTERS
  // ==========================================

  {
    id: "pm-001",
    name: "Robert Anderson",
    photo: "/members/robert-anderson.jpg",
    lodge: "Forest City Lodge",
    pastMasterYears: [1995],
    districtPositions: [],
    honorific: "W.B.",
  },
  {
    id: "pm-002",
    name: "William Carter",
    photo: "/members/william-carter.jpg",
    lodge: "Forest City Lodge",
    pastMasterYears: [2001, 2002],
    districtPositions: [
      {
        title: "District Deputy Grand Master",
        status: "past",
        startYear: 2010,
        endYear: 2012,
      },
    ],
    honorific: "R.W.B.",
  },
  {
    id: "pm-003",
    name: "James Mitchell",
    photo: "/members/james-mitchell.jpg",
    lodge: "Forest City Lodge",
    pastMasterYears: [2005],
    districtPositions: [
      {
        title: "District Education Officer",
        status: "past",
        startYear: 2015,
        endYear: 2018,
      },
    ],
    currentLodgeOffice: "Lodge Education Officer",
    honorific: "W.B.",
  },
  {
    id: "pm-004",
    name: "Thomas Wilson",
    photo: "/members/thomas-wilson.jpg",
    lodge: "Forest City Lodge",
    pastMasterYears: [2009],
    districtPositions: [],
    honorific: "W.B.",
  },
  {
    id: "pm-005",
    name: "Michael Harrison",
    photo: "/members/michael-harrison.jpg",
    lodge: "Forest City Lodge",
    pastMasterYears: [2012],
    districtPositions: [
      {
        title: "District Deputy Grand Master",
        status: "current",
        startYear: 2024,
      },
    ],
    honorific: "R.W.B.",
  },
  {
    id: "pm-006",
    name: "David Thompson",
    photo: "/members/david-thompson.jpg",
    lodge: "Forest City Lodge",
    pastMasterYears: [2016],
    districtPositions: [],
    currentLodgeOffice: "Secretary",
    honorific: "W.B.",
  },
  {
    id: "pm-007",
    name: "Richard Evans",
    photo: "/members/richard-evans.jpg",
    lodge: "Forest City Lodge",
    pastMasterYears: [2020],
    districtPositions: [],
    honorific: "W.B.",
  },
  {
    id: "pm-008",
    name: "Christopher Brown",
    photo: "/members/christopher-brown.jpg",
    lodge: "Forest City Lodge",
    pastMasterYears: [2024],
    districtPositions: [],
    honorific: "W.B.",
  },

  // ==========================================
  // VISITING DISTRICT OFFICERS
  // All are Past Masters of other lodges.
  // ==========================================

  {
    id: "do-001",
    name: "Edward Johnson",
    photo: "/members/edward-johnson.jpg",
    lodge: "Example Lodge No. 101",
    pastMasterYears: [2003],
    districtPositions: [
      {
        title: "District Deputy Grand Master",
        status: "current",
        startYear: 2025,
      },
    ],
    honorific: "R.W.B.",
  },
  {
    id: "do-002",
    name: "George Williams",
    photo: "/members/george-williams.jpg",
    lodge: "Example Lodge No. 202",
    pastMasterYears: [2010],
    districtPositions: [
      {
        title: "District Education Officer",
        status: "current",
        startYear: 2023,
      },
    ],
    honorific: "W.B.",
  },
  {
    id: "do-003",
    name: "Daniel Roberts",
    photo: "/members/daniel-roberts.jpg",
    lodge: "Example Lodge No. 303",
    pastMasterYears: [2007],
    districtPositions: [
      {
        title: "District Deputy Grand Master",
        status: "past",
        startYear: 2016,
        endYear: 2018,
      },
    ],
    honorific: "R.W.B.",
  },
  {
    id: "do-004",
    name: "Charles Peterson",
    photo: "/members/charles-peterson.jpg",
    lodge: "Example Lodge No. 404",
    pastMasterYears: [2015],
    districtPositions: [
      {
        title: "District Education Officer",
        status: "past",
        startYear: 2020,
        endYear: 2022,
      },
      {
        title: "District Deputy Grand Master",
        status: "current",
        startYear: 2024,
      },
    ],
    honorific: "R.W.B.",
  },
];
