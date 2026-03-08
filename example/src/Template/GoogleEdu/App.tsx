import React from 'react'
import CarouselStyle from './App.module.scss'

import ReactSiema from '@yanchespenda/react-siema'
import { CarouselItem, CarouselLinkData } from './App.interface'

type SliderApi = {
  prev: () => void
  next: () => void
  goTo: (index: number) => void
}

function App() {
  const [carouselCurrent, setCarouselCurrent] = React.useState(0)
  const [progressRunId, setProgressRunId] = React.useState(0)
  const sliderRef = React.useRef<SliderApi | null>(null)
  const carouselBar = 10000

  React.useEffect(() => {
    setProgressRunId((prev) => prev + 1)
  }, [carouselCurrent])

  const carouselOptions = React.useMemo(() => ({
    loop: true,
    duration: 800,
    timer: carouselBar,
    easing: "ease-in-out",
    onNext: (currentSlide: number) => {
      setCarouselCurrent(currentSlide)
    },
    onPrev: (currentSlide: number) => {
      setCarouselCurrent(currentSlide)
    },
    onGoTo: (currentSlide: number) => {
      setCarouselCurrent(currentSlide)
    }
  }), [carouselBar])

  const setSliderRef = React.useCallback((siema: SliderApi | null) => {
    sliderRef.current = siema
  }, [])

  const data: CarouselItem[] = [{"carousel_title":"Corousel 2","carousel_desc_data":{"enable":true,"desc":"0W0"},"carousel_link_data":{"enable":true,"target":"_self","link":"https://web.facebook.com","text":"Test"},"carousel_image":{"enable":true,"file_exits":false,"img":"https://myponyasia.s3.us-west-1.wasabisys.com/assets/images/carousel/720/2021/08/9764e8df-c43b-4128-95ca-3eaac26f36eb.webp"}},{"carousel_title":"Testing","carousel_desc_data":{"enable":true,"desc":"Lorem ipsum, dolor sit amet consectetur adipisicing elit. Dolores, enim? Assumenda, omnis beatae architecto at delectus facilis? Perspiciatis, in perferendis."},"carousel_link_data":{"enable":true,"target":"_self","link":"https://www.youtube.com/","text":"https://web.facebook.com/"},"carousel_image":{"enable":true,"file_exits":false,"img":"https://myponyasia.s3.us-west-1.wasabisys.com/assets/images/carousel/720/2021/07/1527820a-2a16-4a1b-9287-69a39d0efde4.webp"}}]

  const getUrl = (url: string) => {
    return 'url(' + url + ')' 
  }

  const senitazeUrl = (url: string) => {
    return url.replace('#|BASE_URL|#', '/')
  }

  const generateCarousel = (item: CarouselLinkData) => {
    const isInternal = item.link.toUpperCase().indexOf('#|BASE_URL|#') > -1
    if (isInternal) {
      return (
        <a href={ senitazeUrl(item.link) }><span className={CarouselStyle.carouselContainerBoxBtnlink}>{ item.text }</span></a>
      )
    } else {
      return (
        <a target="_blank" href={ senitazeUrl(item.link) } className={CarouselStyle.carouselContainerBoxBtnlink} rel="noopener noreferrer" >
          { item.text }
        </a>
      )
    }
  }

  return (
    <React.Fragment>
      {
        data?.length > 0 ? (
          (
            <div className={CarouselStyle.carouselPreContainer}>
                <div className={CarouselStyle.carouselContainer}>
                  <div className={CarouselStyle.carouselItems}>
                    <ReactSiema ref={setSliderRef as any} {...carouselOptions}>
                      {
                        data?.map((item, idx: number) => {
                          return (
                            <div className={CarouselStyle.carouselItem} key={ idx }>
                              {item.carousel_image.enable ? (
                                <div className={[CarouselStyle.carouselContainerImage, CarouselStyle.backdrop].join(' ')} style={{ backgroundImage: getUrl(item.carousel_image.img) }}></div>
                              ) : ''}
                              <div className={[CarouselStyle.carouselContainerBox, CarouselStyle.textCenter].join(' ')}>
                                <h3 className="text-base md:text-2xl lg:text-3xl cursor-default capitalize text-center">{ item.carousel_title }</h3>
                                {
                                  item.carousel_desc_data.enable && item.carousel_desc_data.desc !== 'null' ? (
                                    <div className={CarouselStyle.carouselContainerBoxSubtextContainer}>
                                      <p className={CarouselStyle.carouselContainerBoxSubtext}>
                                        { item.carousel_desc_data.desc }
                                      </p>
                                      <div className={CarouselStyle.carouselContainerBoxSubtextSpacer}></div>
                                    </div>
                                  ):''
                                }
                                {
                                  item.carousel_link_data.enable ? (
                                    <div className={CarouselStyle.textCenter}>
                                      {
                                        generateCarousel(item.carousel_link_data)
                                      }
                                    </div>
                                  ):''
                                }
                              </div>
                            </div>
                          )
                        })
                      }
                    </ReactSiema>
                  </div>
                  <div className={CarouselStyle.carouselNavigation}>
                    <div className={[CarouselStyle.carouselNavigationBtn, CarouselStyle.prev].join(' ')}>
                      <button className={CarouselStyle.carouselNavigationBtnTrigger} onClick={() => sliderRef.current?.prev()}>
                        <div className={CarouselStyle.carouselNavigationBtnTriggerWrap}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className={CarouselStyle.SVGprev}><path d="M9.546 6.5l5.443 5.532L9.5 17.5"></path></svg>
                        </div>
                      </button>
                    </div>
                    <div className={[CarouselStyle.carouselNavigationBtn, CarouselStyle.next].join(' ')}>
                      <button className={CarouselStyle.carouselNavigationBtnTrigger} onClick={() => sliderRef.current?.next()}>
                        <div className={CarouselStyle.carouselNavigationBtnTriggerWrap}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className={CarouselStyle.SVGnext}><path d="M9.546 6.5l5.443 5.532L9.5 17.5"></path></svg>
                        </div>
                      </button>
                    </div>
                    <div className={CarouselStyle.carouselNavigationBlock}>
                      <ul className={CarouselStyle.carouselNavigationBlockUl}>
                        {
                          data?.map((_item, idx: number) => {
                            const isActive = carouselCurrent === idx
                            const currentTimer: React.CSSProperties = isActive
                              ? {
                                  animationDuration: `${carouselBar}ms`,
                                  WebkitAnimationDuration: `${carouselBar}ms`,
                                }
                              : {
                                  animationDuration: '0ms',
                                  WebkitAnimationDuration: '0ms',
                                  transform: 'translateX(-100%)',
                                  WebkitTransform: 'translateX(-100%)',
                                }
                            return (
                              <li className={CarouselStyle.carouselNavigationBlockLi} key={ idx }>
                                <button className={CarouselStyle.carouselNavigationBlockLiTrigger} onClick={() => sliderRef.current?.goTo(idx)}>
                                  <div className={CarouselStyle.carouselNavigationBlockLiTriggerWrap}>
                                    <div
                                      key={isActive ? `${idx}-${progressRunId}` : `${idx}-idle`}
                                      className={[
                                        CarouselStyle.carouselNavigationBlockLiTriggerWrapBar,
                                        isActive ? CarouselStyle.carouselNavigationBlockLiTriggerWrapBarActive : '',
                                      ].join(' ')}
                                      style={ currentTimer }
                                    ></div>
                                  </div>
                                </button>
                              </li>
                            )
                          })
                        }
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
          )
        ) : ''
      }
    </React.Fragment>
  )
}

export default App
