# PixelCrawler

웹 페이지를 실제 브라우저로 렌더링하여 **MHTML**, **PNG**, **PDF** 세 가지 형태로 완전한 스냅샷을 생성하는 CLI 도구입니다. Lazy-load 이미지나 SPA 등 지연 로딩 요소도 자동 스크롤과 로드 안정화 대기를 통해 가능한 한 원본과 동일하게 보존합니다.

## 주요 기능
- `Page.captureSnapshot`을 활용한 MHTML 저장
- 전체 페이지 길이를 캡처한 PNG 스크린샷
- 배경 포함 PDF 출력(A4, 여백 10mm 기본)
- 자동 스크롤 및 `networkidle2` 기반 로드 안정화
- URL 리스트 일괄 처리 및 실패 로그 관리

## 설치
Node.js 18 이상에서 동작합니다.

### 전역 사용
현재 패키지는 npm에 배포되어 있지 않아 `npm install -g pixelcrawler` 방식으로는 설치할 수 없습니다.
소스 코드를 클론한 뒤 다음과 같이 `npm link`(또는 `npm install -g .`)를 실행해 전역 명령으로 등록하세요.
```bash
git clone <repo-url>
cd PixelCrawler
npm install
npm link      # "snap" 명령 전역 등록
snap "https://예시도메인/page"

# 전역 등록 없이 한 번만 실행하려면
npm start -- "https://예시도메인/page"
```

## 사용 예시
단일 URL 스냅샷:
```bash
snap "https://예시도메인/page"
```
여러 URL 일괄 처리:
```bash
snap --list urls.txt
```

### 자주 쓰는 옵션
| 옵션 | 설명 |
|------|------|
| `--out <dir>` | 출력 디렉터리 지정(기본 `snapshot-<타임스탬프>/`) |
| `--viewport WxH` | 뷰포트 크기 지정(기본 1440x900) |
| `--wait-after-load <ms>` | 로드 후 추가 대기 시간 |
| `--scroll-step <px>` | 자동 스크롤 스텝(기본 800) |
| `--scroll-interval <ms>` | 스크롤 간격(기본 200) |
| `--pdf-format <size>` | PDF 용지 크기(기본 A4) |
| `--pdf-margin <unit>` | PDF 여백(기본 10mm) |
| `--concurrency <n>` | 동시 처리 개수(기본 1) |

전체 옵션은 `snap --help`에서 확인할 수 있습니다.

## 출력 규칙
- 최상위 폴더: `snapshot-<YYYYMMDD-HHMMSS>/`
- URL별 하위 폴더: `<hostname>__<path-slug>/`
- 파일명: 루트 경로면 `index.(png|pdf|mhtml)`, 그 외는 경로 기반 slug

## 종료 코드
| 코드 | 의미 |
|------|------|
| `0` | 모든 URL 처리 성공 |
| `2` | 일부 URL 실패 |
| `1` | 모든 URL 실패 |

## 라이선스
MIT

