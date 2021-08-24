export interface CarouselDescData {
  enable: boolean
  desc: string
}

export interface CarouselLinkData {
  enable: boolean
  target: string
  link: string
  text: string
}

export interface CarouselImage {
  enable: boolean
  file_exits: boolean
  img: string
}

export interface CarouselItem {
  carousel_title: string
  carousel_desc_data: CarouselDescData
  carousel_link_data: CarouselLinkData
  carousel_image: CarouselImage
}