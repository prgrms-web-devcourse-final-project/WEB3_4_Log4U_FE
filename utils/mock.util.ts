// utils/mockData.ts
import { Diary } from "@root/types/diary";
import { Comment } from "@root/types/comment";
import { User } from "@root/types/user";
import { Pagination } from "@root/types/pagination";

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

// 랜덤 도시 이름
function randomCity(): string {
  const cities = [
    "서울특별시",
    "부산광역시",
    "인천광역시",
    "대구광역시",
    "광주광역시",
    "대전광역시",
    "울산광역시",
    "세종특별자치시",
    "경기도",
    "강원도",
    "충청북도",
    "충청남도",
    "전라북도",
    "전라남도",
    "경상북도",
    "경상남도",
    "제주도",
  ];
  const districts = [
    "중구",
    "동구",
    "서구",
    "남구",
    "북구",
    "강남구",
    "강북구",
    "강서구",
    "강동구",
    "성북구",
    "성동구",
    "용산구",
    "종로구",
    "마포구",
    "영등포구",
    "서초구",
    "송파구",
    "은평구",
    "광진구",
    "중랑구",
  ];

  return `${cities[Math.floor(Math.random() * cities.length)]} ${districts[Math.floor(Math.random() * districts.length)]}`;
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
      return [] as any;
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
        diaries: IDiary.Details(3), // 최근 다이어리 3개만 포함
        pageInfo: {
          hasNext: true,
          nextCursor: "cursor_123456",
          totalElements: diaryCount,
          size: 3,
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
