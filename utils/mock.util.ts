// utils/mockData.ts
import { Diary } from "@root/types/diary";
import { Comment } from "@root/types/comment";
import { User } from "@root/types/user";

// 임의의 날짜 생성 (최근 30일 이내)
function randomRecentDate(): string {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return date.toISOString();
}

// 랜덤 위치 생성 (한국 내)
function randomKoreaLocation(): { lat: number; lng: number } {
  // 한국 대략적인 위도/경도 범위
  const lat = 33.0 + Math.random() * 5.0; // 33.0 ~ 38.0
  const lng = 124.0 + Math.random() * 8.0; // 124.0 ~ 132.0
  return {
    lat: parseFloat(lat.toFixed(6)),
    lng: parseFloat(lng.toFixed(6)),
  };
}

// 랜덤 제목 생성
function randomTitle(): string {
  const prefixes = [
    "즐거운",
    "행복한",
    "신나는",
    "여유로운",
    "조용한",
    "설레는",
    "멋진",
  ];
  const activities = [
    "여행",
    "일상",
    "카페 탐방",
    "맛집 탐방",
    "산책",
    "드라이브",
    "피크닉",
  ];
  const suffixes = ["기록", "추억", "일기", "순간", "이야기", "시간", "경험"];

  return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${activities[Math.floor(Math.random() * activities.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
}

// 랜덤 내용 생성
function randomContent(): string {
  const sentences = [
    "오늘은 정말 즐거운 하루였다.",
    "생각지도 못한 멋진 장소를 발견했다.",
    "날씨가 너무 좋아서 기분이 좋았다.",
    "오랜만에 여유롭게 시간을 보냈다.",
    "맛있는 음식을 먹으며 행복한 시간을 보냈다.",
    "친구들과 함께해서 더 즐거웠다.",
    "다음에 또 오고 싶은 곳이다.",
    "사진으로 담기 아쉬울 정도로 아름다웠다.",
    "처음 가본 곳인데 기대 이상이었다.",
    "마음이 편안해지는 순간이었다.",
  ];

  let content = "";
  const paragraphCount = 2 + Math.floor(Math.random() * 3);

  for (let i = 0; i < paragraphCount; i++) {
    const sentenceCount = 3 + Math.floor(Math.random() * 5);
    const paragraph = [];

    for (let j = 0; j < sentenceCount; j++) {
      paragraph.push(sentences[Math.floor(Math.random() * sentences.length)]);
    }

    content += paragraph.join(" ") + "\n\n";
  }

  return content.trim();
}

// 랜덤 닉네임 생성
function randomNickname(): string {
  const prefixes = [
    "행복한",
    "즐거운",
    "멋진",
    "귀여운",
    "신나는",
    "열정적인",
    "차분한",
  ];
  const nouns = [
    "여행자",
    "사진사",
    "작가",
    "기록가",
    "탐험가",
    "미식가",
    "블로거",
  ];
  const suffixes = ["123", "2023", "_official", ".daily", "_", "J", "K"];

  const usePrefix = Math.random() > 0.3;
  const useSuffix = Math.random() > 0.7;

  let nickname = "";
  if (usePrefix) {
    nickname += prefixes[Math.floor(Math.random() * prefixes.length)];
  }

  nickname += nouns[Math.floor(Math.random() * nouns.length)];

  if (useSuffix) {
    nickname += suffixes[Math.floor(Math.random() * suffixes.length)];
  }

  return nickname;
}

// 랜덤 프로필 이미지 URL 생성
function randomProfileImage(): string {
  const imageIds = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
  ];
  return `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? "women" : "men"}/${imageIds[Math.floor(Math.random() * imageIds.length)]}.jpg`;
}

// 랜덤 이미지 URL 생성
function randomImageUrl(): string {
  const width = 300 + Math.floor(Math.random() * 700);
  const height = 300 + Math.floor(Math.random() * 400);
  return `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/${width}/${height}`;
}

// 랜덤 미디어 생성
function createRandomMedia(index: number): Diary.DiaryMedia {
  const extensions = ["jpg", "png", "jpeg"];
  const extension = extensions[Math.floor(Math.random() * extensions.length)];
  const size = 500000 + Math.floor(Math.random() * 4000000); // 500KB ~ 4.5MB

  return {
    mediaId: 1000 + index,
    originalName: `image_${index}.${extension}`,
    contentType: `image/${extension === "jpg" ? "jpeg" : extension}`,
    size: size,
    url: randomImageUrl(),
    orderIndex: index,
  };
}

// 날씨 정보 랜덤 선택
function randomWeatherInfo(): Diary.WeatherType {
  const weatherTypes = Object.values(Diary.WeatherType);
  return weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
}

// 공개 범위 랜덤 선택
function randomVisibility(): Diary.Visibility {
  const visibilities = Object.values(Diary.Visibility);
  return visibilities[Math.floor(Math.random() * visibilities.length)];
}

export namespace MockUtil {
  export namespace IDiary {
    export function Details(count: number): Diary.Detail[] {
      const diaries: Diary.Detail[] = [];

      for (let i = 0; i < count; i++) {
        const location = randomKoreaLocation();
        const createdAt = randomRecentDate();
        const mediaCount = Math.floor(Math.random() * 5) + 1; // 1~5개 미디어
        const mediaList: Diary.DiaryMedia[] = [];

        for (let j = 0; j < mediaCount; j++) {
          mediaList.push(createRandomMedia(j));
        }

        const { sido, sigungu, dongmyun } = generateRandomAddress();
        diaries.push({
          diaryId: 1000 + i,
          userId: 100 + Math.floor(Math.random() * 20),
          latitude: location.lat,
          longitude: location.lng,
          title: randomTitle(),
          content: randomContent(),
          weatherInfo: randomWeatherInfo(),
          visibility: randomVisibility(),
          createdAt: createdAt,
          updatedAt: createdAt,
          thumbnailUrl:
            mediaList.length > 0 ? mediaList[0].url : randomImageUrl(),
          likeCount: Math.floor(Math.random() * 1000),
          mediaList: mediaList,
          sido,
          sigungu,
          dongmyun,
        });
      }

      return diaries;
    }

    export function Summaries(count: number): Diary.Detail[] {
      // 현재는 Detail과 동일한 구조를 반환. 실제로는 Summary 인터페이스에 맞게 수정 필요
      return Details(count);
    }

    // 검색용 목 데이터 (지도 마커 포함)
    export function SearchResults(
      query: string,
      count: number,
    ): {
      diaries: Diary.Detail[];
      markers: Array<{
        id: number;
        lat: number;
        lng: number;
        profileUrl: string;
        count: number;
      }>;
    } {
      const diaries = Details(count);

      // 마커 데이터 생성 (위치 기반으로 그룹화)
      const locationGroups: Record<
        string,
        {
          lat: number;
          lng: number;
          diaries: Diary.Detail[];
        }
      > = {};

      diaries.forEach((diary) => {
        const key = `${diary.latitude.toFixed(2)}_${diary.longitude.toFixed(2)}`;

        if (!locationGroups[key]) {
          locationGroups[key] = {
            lat: diary.latitude,
            lng: diary.longitude,
            diaries: [],
          };
        }

        locationGroups[key].diaries.push(diary);
      });

      const markers = Object.values(locationGroups).map((group, index) => ({
        id: index + 1,
        lat: group.lat,
        lng: group.lng,
        profileUrl: group.diaries[0].thumbnailUrl,
        count: group.diaries.length,
      }));

      return { diaries, markers };
    }
  }

  export namespace IComment {
    export function Summaries(count: number): Comment.Summary[] {
      const comments: Comment.Summary[] = [];

      for (let i = 0; i < count; i++) {
        comments.push({
          commentId: 2000 + i,
          content: Math.random() > 0.3 ? "좋아요!" : "멋진 사진이네요!",
          createdAt: randomRecentDate(),
          author: {
            userId: 100 + Math.floor(Math.random() * 20),
            nickname: randomNickname(),
            thumbnailUrl: randomProfileImage(),
          },
        });
      }

      return comments;
    }

    export function Details(count: number): Comment.Detail[] {
      // Comment.Detail 인터페이스 구현이 필요함
      return [];
    }
  }

  export namespace IUser {
    export function Me(): User.Me {
      const diaryCount = 5 + Math.floor(Math.random() * 20);

      return {
        userId: 101,
        name: "김다이어리",
        nickname: "winter",
        statusMessage: "다이어리 기록 중...",
        diaryCount: diaryCount,
        profileImage: randomProfileImage(),
        followers: 100 + Math.floor(Math.random() * 900),
        followings: 50 + Math.floor(Math.random() * 200),
        list: IDiary.Details(diaryCount).slice(0, 9),
        pageInfo: {
          hasNext: true,
          page: 1,
          totalPages: Math.ceil(diaryCount / 9),
          totalElements: diaryCount,
          size: 9,
        },
      };
    }

    export function Users(count: number): Array<{
      userId: number;
      nickname: string;
      profileImage: string;
    }> {
      const users = [];

      for (let i = 0; i < count; i++) {
        users.push({
          userId: 100 + i,
          nickname: randomNickname(),
          profileImage: randomProfileImage(),
        });
      }

      return users;
    }

    export function PopularUsers(): Array<{
      userId: number;
      nickname: string;
      profileImage: string;
    }> {
      return [
        { userId: 101, nickname: "winter", profileImage: randomProfileImage() },
        { userId: 102, nickname: "karina", profileImage: randomProfileImage() },
        {
          userId: 103,
          nickname: "ttayjin",
          profileImage: randomProfileImage(),
        },
        { userId: 104, nickname: "ppakse", profileImage: randomProfileImage() },
        { userId: 105, nickname: "mjpark", profileImage: randomProfileImage() },
        { userId: 106, nickname: "kjs777", profileImage: randomProfileImage() },
        { userId: 107, nickname: "mrlee", profileImage: randomProfileImage() },
        {
          userId: 108,
          nickname: "travelover",
          profileImage: randomProfileImage(),
        },
        {
          userId: 109,
          nickname: "foodlove",
          profileImage: randomProfileImage(),
        },
        { userId: 110, nickname: "leesom", profileImage: randomProfileImage() },
      ];
    }
  }
}

// 사용 예시:
// const mockDiaries = MockUtil.IDiary.Details(5); // 5개의 랜덤 다이어리 생성
// const mockComments = MockUtil.IComment.Summaries(10); // 10개의 랜덤 댓글 생성
// const mockUser = MockUtil.IUser.Me(); // 현재 사용자 정보 생성
// 위치 정보 랜덤 생성 함수

// 한국 행정구역 데이터
const koreaRegions = {
  // 서울
  서울특별시: {
    sigungu: [
      "강남구",
      "강동구",
      "강북구",
      "강서구",
      "관악구",
      "광진구",
      "구로구",
      "금천구",
      "노원구",
      "도봉구",
      "동대문구",
      "동작구",
      "마포구",
      "서대문구",
      "서초구",
      "성동구",
      "성북구",
      "송파구",
      "양천구",
      "영등포구",
      "용산구",
      "은평구",
      "종로구",
      "중구",
      "중랑구",
    ],
    dongmyun: {
      강남구: [
        "역삼동",
        "개포동",
        "청담동",
        "삼성동",
        "대치동",
        "신사동",
        "논현동",
        "압구정동",
        "세곡동",
        "자곡동",
        "율현동",
        "일원동",
      ],
      서초구: ["서초동", "잠원동", "반포동", "방배동", "양재동", "내곡동"],
      송파구: [
        "가락동",
        "거여동",
        "마천동",
        "문정동",
        "방이동",
        "삼전동",
        "석촌동",
        "송파동",
        "오금동",
        "잠실동",
        "장지동",
        "풍납동",
      ],
      강서구: [
        "가양동",
        "개화동",
        "공항동",
        "등촌동",
        "방화동",
        "염창동",
        "화곡동",
      ],
      마포구: [
        "망원동",
        "상암동",
        "서교동",
        "성산동",
        "신수동",
        "연남동",
        "합정동",
      ],
    },
  },
  // 부산
  부산광역시: {
    sigungu: [
      "강서구",
      "금정구",
      "남구",
      "동구",
      "동래구",
      "부산진구",
      "북구",
      "사상구",
      "사하구",
      "서구",
      "수영구",
      "연제구",
      "영도구",
      "중구",
      "해운대구",
      "기장군",
    ],
    dongmyun: {
      해운대구: ["우동", "중동", "좌동", "송정동", "반여동", "재송동"],
      수영구: ["남천동", "망미동", "광안동", "민락동", "수영동"],
      부산진구: [
        "부전동",
        "양정동",
        "전포동",
        "범천동",
        "범전동",
        "연지동",
        "초읍동",
      ],
    },
  },
  // 인천
  인천광역시: {
    sigungu: [
      "계양구",
      "남동구",
      "동구",
      "미추홀구",
      "부평구",
      "서구",
      "연수구",
      "중구",
      "강화군",
      "옹진군",
    ],
    dongmyun: {
      연수구: ["송도동", "연수동", "청학동", "동춘동", "옥련동"],
      서구: ["검암동", "연희동", "청라동", "가정동", "석남동"],
    },
  },
  // 경기도
  경기도: {
    sigungu: [
      "고양시",
      "과천시",
      "광명시",
      "광주시",
      "구리시",
      "군포시",
      "김포시",
      "남양주시",
      "동두천시",
      "부천시",
      "성남시",
      "수원시",
      "시흥시",
      "안산시",
      "안성시",
      "안양시",
      "양주시",
      "여주시",
      "오산시",
      "용인시",
      "의왕시",
      "의정부시",
      "이천시",
      "파주시",
      "평택시",
      "포천시",
      "하남시",
      "화성시",
      "가평군",
      "양평군",
      "연천군",
    ],
    dongmyun: {
      성남시: ["수정구", "중원구", "분당구"],
      수원시: ["장안구", "권선구", "팔달구", "영통구"],
      용인시: ["처인구", "기흥구", "수지구"],
    },
  },
  // 기타 광역시
  대전광역시: {
    sigungu: ["대덕구", "동구", "서구", "유성구", "중구"],
    dongmyun: {
      유성구: ["신성동", "전민동", "구성동", "관평동", "노은동"],
    },
  },
  대구광역시: {
    sigungu: [
      "남구",
      "달서구",
      "동구",
      "북구",
      "서구",
      "수성구",
      "중구",
      "달성군",
    ],
    dongmyun: {
      수성구: ["범어동", "만촌동", "황금동", "중동"],
    },
  },
  광주광역시: {
    sigungu: ["광산구", "남구", "동구", "북구", "서구"],
    dongmyun: {
      서구: ["치평동", "풍암동", "금호동", "상무동"],
    },
  },
  울산광역시: {
    sigungu: ["남구", "동구", "북구", "중구", "울주군"],
    dongmyun: {
      남구: ["삼산동", "달동", "신정동", "옥동"],
    },
  },
  // 도
  강원도: {
    sigungu: [
      "강릉시",
      "동해시",
      "삼척시",
      "속초시",
      "원주시",
      "춘천시",
      "태백시",
      "고성군",
      "양구군",
      "양양군",
      "영월군",
      "인제군",
      "정선군",
      "철원군",
      "평창군",
      "홍천군",
      "화천군",
      "횡성군",
    ],
    dongmyun: {
      강릉시: ["교동", "노암동", "성덕동", "홍제동", "월호평동"],
      원주시: ["단계동", "무실동", "반곡동", "일산동"],
    },
  },
  충청북도: {
    sigungu: [
      "제천시",
      "청주시",
      "충주시",
      "괴산군",
      "단양군",
      "보은군",
      "영동군",
      "옥천군",
      "음성군",
      "증평군",
      "진천군",
    ],
    dongmyun: {
      청주시: ["상당구", "서원구", "흥덕구", "청원구"],
    },
  },
  충청남도: {
    sigungu: [
      "계룡시",
      "공주시",
      "논산시",
      "당진시",
      "보령시",
      "서산시",
      "아산시",
      "천안시",
      "금산군",
      "부여군",
      "서천군",
      "예산군",
      "청양군",
      "태안군",
      "홍성군",
    ],
    dongmyun: {
      천안시: ["동남구", "서북구"],
    },
  },
  전라북도: {
    sigungu: [
      "군산시",
      "김제시",
      "남원시",
      "익산시",
      "전주시",
      "정읍시",
      "고창군",
      "무주군",
      "부안군",
      "순창군",
      "완주군",
      "임실군",
      "장수군",
      "진안군",
    ],
    dongmyun: {
      전주시: ["완산구", "덕진구"],
    },
  },
  전라남도: {
    sigungu: [
      "광양시",
      "나주시",
      "목포시",
      "순천시",
      "여수시",
      "강진군",
      "고흥군",
      "곡성군",
      "구례군",
      "담양군",
      "무안군",
      "보성군",
      "신안군",
      "영광군",
      "영암군",
      "완도군",
      "장성군",
      "장흥군",
      "진도군",
      "함평군",
      "해남군",
      "화순군",
    ],
    dongmyun: {
      순천시: ["해룡면", "서면", "황전면", "월등면", "주암면"],
    },
  },
  경상북도: {
    sigungu: [
      "경산시",
      "경주시",
      "구미시",
      "김천시",
      "문경시",
      "상주시",
      "안동시",
      "영주시",
      "영천시",
      "포항시",
      "고령군",
      "군위군",
      "봉화군",
      "성주군",
      "영덕군",
      "영양군",
      "예천군",
      "울릉군",
      "울진군",
      "의성군",
      "청도군",
      "청송군",
      "칠곡군",
    ],
    dongmyun: {
      포항시: ["남구", "북구"],
    },
  },
  경상남도: {
    sigungu: [
      "거제시",
      "김해시",
      "밀양시",
      "사천시",
      "양산시",
      "진주시",
      "창원시",
      "통영시",
      "거창군",
      "고성군",
      "남해군",
      "산청군",
      "의령군",
      "창녕군",
      "하동군",
      "함안군",
      "함양군",
      "합천군",
    ],
    dongmyun: {
      창원시: ["의창구", "성산구", "마산합포구", "마산회원구", "진해구"],
    },
  },
  제주특별자치도: {
    sigungu: ["제주시", "서귀포시"],
    dongmyun: {
      제주시: ["건입동", "노형동", "도남동", "삼도동", "용담동", "이도동"],
      서귀포시: ["대정읍", "남원읍", "성산읍", "안덕면", "표선면"],
    },
  },
  세종특별자치시: {
    sigungu: ["세종시"],
    dongmyun: {
      세종시: [
        "고운동",
        "나성동",
        "다정동",
        "도담동",
        "반곡동",
        "보람동",
        "새롬동",
        "소담동",
        "아름동",
        "종촌동",
        "한솔동",
      ],
    },
  },
};

// 시도 목록
const sidoList = Object.keys(koreaRegions);

/**
 * 랜덤 시도 생성
 * @returns {string} 랜덤 시도명
 */
function generateRandomSido(): keyof typeof koreaRegions {
  return sidoList[
    Math.floor(Math.random() * sidoList.length)
  ] as keyof typeof koreaRegions;
}

/**
 * 특정 시도의 랜덤 시군구 생성
 * @param {string} sido 시도명
 * @returns {string} 랜덤 시군구명
 */
function generateRandomSigungu(sido: keyof typeof koreaRegions): string {
  if (!koreaRegions[sido]) return "중구"; // 기본값

  const sigunguList = koreaRegions[sido].sigungu;
  return sigunguList[Math.floor(Math.random() * sigunguList.length)];
}

/**
 * 특정 시도와 시군구의 랜덤 동/읍/면 생성
 * @param {string} sido 시도명
 * @param {string} sigungu 시군구명
 * @returns {string} 랜덤 동/읍/면명
 */
function generateRandomDongmyun(sido: string, sigungu: string): string {
  const typedsido = sido as keyof typeof koreaRegions;
  const typedSigungu = sigungu as keyof typeof koreaRegion.dongmyun;
  const koreaRegion = koreaRegions[typedsido];

  if (!koreaRegion || !koreaRegion.dongmyun[typedSigungu]) {
    // 해당 시군구의 동/읍/면 정보가 없으면 기본 동명 반환
    return `${Math.floor(Math.random() * 10) + 1}동`;
  }

  const dongmyunList: (keyof typeof koreaRegion)[keyof typeof koreaRegion.dongmyun] =
    koreaRegion.dongmyun[typedSigungu];
  return dongmyunList[Math.floor(Math.random() * dongmyunList.length)];
}

/**
 * 랜덤 행정구역 정보 생성 함수
 * @returns {Object} 시도, 시군구, 동/읍/면 정보
 */
function generateRandomAddress(): {
  sido: string;
  sigungu: string;
  dongmyun: string;
} {
  const sido = generateRandomSido();
  const sigungu = generateRandomSigungu(sido);
  const dongmyun = generateRandomDongmyun(sido, sigungu);

  return {
    sido,
    sigungu,
    dongmyun,
  };
}

// Mock 데이터 유틸리티에 추가할 수 있는 함수
export namespace MockUtil {
  export namespace ILocation {
    /**
     * 랜덤 한국 행정구역 정보 생성
     * @returns {Object} 시도, 시군구, 동/읍/면 정보
     */
    export function generateRandomKoreanAddress(): {
      sido: string;
      sigungu: string;
      dongmyun: string;
    } {
      return generateRandomAddress();
    }

    /**
     * 여러 개의 랜덤 행정구역 정보 생성
     * @param {number} count 생성할 개수
     * @returns {Array} 행정구역 정보 배열
     */
    export function generateMultipleAddresses(
      count: number,
    ): Array<{ sido: string; sigungu: string; dongmyun: string }> {
      const addresses = [];
      for (let i = 0; i < count; i++) {
        addresses.push(generateRandomAddress());
      }
      return addresses;
    }

    /**
     * 특정 시도 내의 랜덤 행정구역 정보 생성
     * @param {string} sido 시도명
     * @returns {Object} 시도, 시군구, 동/읍/면 정보
     */
    export function generateAddressInSido(sido: keyof typeof koreaRegions): {
      sido: string;
      sigungu: string;
      dongmyun: string;
    } {
      if (!koreaRegions[sido]) {
        return generateRandomAddress(); // 해당 시도가 없으면 랜덤 주소 반환
      }

      const sigungu = generateRandomSigungu(sido);
      const dongmyun = generateRandomDongmyun(sido, sigungu);

      return {
        sido,
        sigungu,
        dongmyun,
      };
    }

    /**
     * 주요 도시 목록 반환 (대도시 중심)
     * @returns {Array} 주요 도시 목록
     */
    export function getMajorCities(): Array<{ sido: string; sigungu: string }> {
      return [
        { sido: "서울특별시", sigungu: "강남구" },
        { sido: "서울특별시", sigungu: "서초구" },
        { sido: "서울특별시", sigungu: "송파구" },
        { sido: "서울특별시", sigungu: "마포구" },
        { sido: "부산광역시", sigungu: "해운대구" },
        { sido: "부산광역시", sigungu: "부산진구" },
        { sido: "인천광역시", sigungu: "연수구" },
        { sido: "대구광역시", sigungu: "수성구" },
        { sido: "대전광역시", sigungu: "유성구" },
        { sido: "광주광역시", sigungu: "서구" },
        { sido: "경기도", sigungu: "성남시" },
        { sido: "경기도", sigungu: "수원시" },
        { sido: "경기도", sigungu: "용인시" },
        { sido: "제주특별자치도", sigungu: "제주시" },
      ];
    }

    /**
     * 행정구역 전체 데이터 가져오기
     * @returns {Object} 전체 행정구역 데이터
     */
    export function getFullRegionData() {
      return koreaRegions;
    }
  }
}

// 사용 예시:
// const randomAddress = MockUtil.ILocation.generateRandomKoreanAddress();
// console.log(`${randomAddress.sido} ${randomAddress.sigungu} ${randomAddress.dongmyun}`);
//
// // 10개의 랜덤 주소 생성
// const addresses = MockUtil.ILocation.generateMultipleAddresses(10);
//
// // 서울 내의 랜덤 주소 생성
// const seoulAddress = MockUtil.ILocation.generateAddressInSido("서울특별시");
