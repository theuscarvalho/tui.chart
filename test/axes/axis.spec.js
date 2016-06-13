/**
 * @fileoverview Test for Axis.
 * @author NHN Ent.
 *         FE Development Team <dl_javascript@nhnent.com>
 */

'use strict';

var Axis = require('../../src/js/axes/axis');
var dom = require('../../src/js/helpers/domHandler');
var renderUtil = require('../../src/js/helpers/renderUtil');

describe('Test for Axis', function() {
    var dataProcessor, boundsMaker, axis;

    beforeAll(function() {
        // 브라우저마다 렌더된 너비, 높이 계산이 다르기 때문에 일관된 결과가 나오도록 처리함
        spyOn(renderUtil, 'getRenderedLabelWidth').and.returnValue(50);
        spyOn(renderUtil, 'getRenderedLabelHeight').and.returnValue(20);
    });

    beforeEach(function() {
        dataProcessor = jasmine.createSpyObj('dataProcessor', ['isValidAllSeriesDataModel', 'getCategories', 'getMultilineCategories']);
        boundsMaker = jasmine.createSpyObj('boundsMaker', ['registerBaseDimension', 'getDimension', 'getPosition']);
        axis = new Axis({
            theme: {
                title: {
                    fontSize: 12
                },
                label: {
                    fontSize: 12
                },
                tickColor: 'black'
            },
            options: {
                title: 'Axis Title'
            },
            dataProcessor: dataProcessor,
            boundsMaker: boundsMaker
        });
    });

    describe('_makeXAxisHeight()', function() {
        it('x축 영역의 높이를 계산하여 반환합니다.', function() {
            var actual, expected;

            axis.options.title = 'Axis Title';
            actual = axis._makeXAxisHeight();
            expected = 60;

            expect(actual).toBe(expected);
        });
    });

    describe('_makeYAxisWidth()', function() {
        it('제목 높이와 tick 레이블 너비를 계산하여 y축 영역의 너비를 구합니다.', function() {
            var actual, expected;

            actual = axis._makeYAxisWidth(['label1', 'label12'], {
                title: 'Axis Title'
            });
            expected = 87;

            expect(actual).toBe(expected);
        });

        it('rotateTitle옵션이 false인 경우에는 제목 높이로 계산합니다.', function() {
            var actual, expected;

            actual = axis._makeYAxisWidth(['label1', 'label12'], {
                title: 'Axis Title',
                rotateTitle: false
            });
            expected = 117;

            expect(actual).toBe(expected);
        });

        it('isCenter 옵션으로 인해 중앙에 배치될 경우에는 title영역의 너비는 배제되고 여백이 추가로 적용됩니다.', function() {
            var actual, expected;

            actual = axis._makeYAxisWidth(['label1', 'label12'], {
                title: 'Axis Title',
                isCenter: true
            });
            expected = 64;

            expect(actual).toBe(expected);
        });
    });

    describe('_isValidAxis()', function() {
        it('component name이 rightYAxis가 아니면 true를 반환합니다.', function() {
            var actual, expected;

            axis.componentName = 'xAxis';
            actual = axis._isValidAxis();
            expected = true;

            expect(actual).toBe(expected);
        });

        it('component name이 rightYAxis면서 isValidAllGroup이 false이면  false를 반환합니다.', function() {
            var actual, expected;

            axis.componentName = 'rightYAxis';

            dataProcessor.isValidAllSeriesDataModel.and.returnValue(false);

            actual = axis._isValidAxis();
            expected = false;

            expect(actual).toBe(expected);
        });
    });

    describe('registerDimension()', function() {
        it('_isValidAxis()가 false이면 boundsMaker에 등록하지 않습니다.', function() {
            spyOn(axis, '_isValidAxis').and.returnValues(false);
            axis.componentName = 'yAxis';

            axis.registerDimension();

            expect(boundsMaker.registerBaseDimension).not.toHaveBeenCalled();
        });

        it('componentType이 xAxis일 경우에는 dimension height를 계산하여 boundsMaker에 등록합니다.', function() {
            var expected = {
                height: 60
            };

            axis.componentName = 'xAxis';
            axis.componentType = 'xAxis';

            axis.registerDimension();

            expect(boundsMaker.registerBaseDimension).toHaveBeenCalledWith(axis.componentName, expected);
        });

        it('componentType이 xAxis가 아니면서 isLabel이 true이면 dimension width를 계산하여 boundsMaker에 등록합니다.', function() {
            var expected = {
                width: 87
            };

            axis.componentName = 'yAxis';
            axis.componentType = 'yAxis';
            axis.isLabel = true;

            dataProcessor.getCategories.and.returnValue(['cate1', 'cate2']);

            axis.registerDimension();

            expect(boundsMaker.registerBaseDimension).toHaveBeenCalledWith(axis.componentName, expected);
        });

        it('componentType이 xAxis가 아니면서 isLabel이 true가 아니면 boundsMaker에 등록하지 않습니다.', function() {
            axis.componentName = 'yAxis';
            axis.componentType = 'yAxis';

            dataProcessor.getCategories.and.returnValue(['cate1', 'cate2']);

            axis.registerDimension();

            expect(boundsMaker.registerBaseDimension).not.toHaveBeenCalled();
        });
    });

    describe('registerAdditionalDimension()', function() {
        it('_isInvalidRightYAxis()가 false이면 boundsMaker에 등록하지 않습니다.', function() {
            spyOn(axis, '_isValidAxis').and.returnValues(false);
            axis.componentName = 'yAxis';

            axis.registerAdditionalDimension();

            expect(boundsMaker.registerBaseDimension).not.toHaveBeenCalled();
        });

        it('componentType이 yAxis면서 isLabel이 true가 아니면 dimension width를 계산하여 boundsMaker에 등록합니다.', function() {
            var expected = {
                width: 87
            };

            axis.componentName = 'yAxis';
            axis.componentType = 'yAxis';

            boundsMaker.axesData = {
                yAxis: {
                    labels: ['label1', 'label2'],
                    options: {
                        title: 'Axis title'
                    }
                }
            };

            axis.registerAdditionalDimension();

            expect(boundsMaker.registerBaseDimension).toHaveBeenCalledWith(axis.componentName, expected);
        });
    });

    describe('_renderOppositeSideTickArea()', function() {
        it('isCenter 옵션으로 인해 중앙에 배치될 경우 기존의 tick area html을 복사하며 우측을 표현하는 tick area를 추가적으로 생성하여 반환합니다.', function() {
            var actual, expectedHtml, expectedClass;

            axis.options.isCenter = true;
            actual = axis._renderOppositeSideTickArea('html');
            expectedHtml = 'html';
            expectedClass = 'tui-chart-tick-area opposite-side';

            expect(actual.innerHTML).toBe(expectedHtml);
            expect(actual.className).toBe(expectedClass);
        });

        it('isCenter 옵션이 없다면 undefined를 반환합니다.', function() {
            var actual = axis._renderOppositeSideTickArea('html');

            expect(actual).toBeUndefined();
        });
    });

    describe('_addCssClasses()', function() {
        it('isVertical이 true인 경우에는 container의 css className에 vertical 값을 설정합니다.', function() {
            var container = dom.create('DIV'),
                actual, expected;

            axis.data.isVertical = true;
            axis._addCssClasses(container);
            actual = container.className;
            expected = 'vertical';

            expect(actual).toMatch(expected);
        });

        it('isVertical이 없거나 false인 경우에는 container의 css className에 horizontal 값을 설정합니다.', function() {
            var container = dom.create('DIV'),
                actual, expected;

            axis._addCssClasses(container);
            actual = container.className;
            expected = 'horizontal';

            expect(actual).toMatch(expected);
        });

        it('isPositionRight이 true인 경우에는 container의 css className에 right 값을 설정합니다.', function() {
            var container = dom.create('DIV'),
                isPositionRight = true,
                actual, expected;

            axis.data.isPositionRight = true;
            axis._addCssClasses(container);
            actual = container.className;
            expected = 'right';

            expect(actual).toMatch(expected);
        });

        it('isPositionRight이 없거나 false인 경우에는 container의 css className에 right 값이 설정되지 않습니다.', function() {
            var container = dom.create('DIV'),
                actual, expected;

            axis._addCssClasses(container);
            actual = container.className;
            expected = 'right';

            expect(actual).not.toMatch(expected);
        });

        it('options의 isCenter가 true인 경우에는 container의 css className에 center 값을 설정합니다.', function() {
            var container = dom.create('DIV'),
                actual, expected;

            axis.options.isCenter = true;
            axis._addCssClasses(container);
            actual = container.className;
            expected = 'center';

            expect(actual).toMatch(expected);
        });

        it('options의 isCenter가 없거나 false인 경우에는 container의 css className에 center 값이 설정되지 않습니다.', function() {
            var container = dom.create('DIV'),
                actual, expected;

            axis._addCssClasses(container);
            actual = container.className;
            expected = 'center';

            expect(actual).not.toMatch(expected);
        });
    });

    describe('_makePositionMapForCenterAlign()', function() {
        it('y축이 중앙 정렬을 위해 제목 높이와 y축 너비 x축 높이를 이용하여 postion(left, bottom)정보를 생성합니다.', function() {
            var actual;

            boundsMaker.getDimension.and.callFake(function(componentType) {
                return {
                    xAxis: {
                        height: 50
                    },
                    yAxis: {
                        width: 100
                    }
                }[componentType];
            });

            actual = axis._makePositionMapForCenterAlign();

            expect(actual.left).toBe(25);
            expect(actual.bottom).toBe(-50);
        });
    });

    describe('_makeRightPosition', function() {
        it('IE7에서는 0을 반환합니다.', function() {
            var actual;

            spyOn(renderUtil, 'isIE7').and.returnValue(true);

            actual = axis._makeRightPosition();

            expect(actual).toBe(0);
        });

        it('rotateTitle옵션이 false인 경우에도 0을 반환합니다.', function() {
            var actual;

            axis.options.rotateTitle = false;

            actual = axis._makeRightPosition();

            expect(actual).toBe(0);
        });

        it('IE7도 아니고 rotateTitle옵션도 없다면 전달하는 size를 음수로 변경하여 반환합니다.', function() {
            var actual;

            spyOn(renderUtil, 'isIE7').and.returnValue(false);

            actual = axis._makeRightPosition(100);

            expect(actual).toBe(-100);
        });
    });

    describe('_makeTopPosition()', function() {
        it('rotateTitle옵션이 false인 경우에는 전달하는 size에서 제목 높이값을 뺀 값의 반을 반환합니다.', function() {
            var actual;

            axis.options.rotateTitle = false;

            actual = axis._makeTopPosition(100);

            expect(actual).toBe(40);
        });

        it('rotateTitle옵션 없이 오른쪽 y축(isPositionRight=true)인 경우에는 0을 반환합니다.', function() {
            var actual;

            axis.data.isPositionRight = true;
            actual = axis._makeTopPosition();

            expect(actual).toBe(0);
        });

        it('rotateTitle옵션도 없고 오른쪽 y축도 아니며 구형브라우저(IE8이하)도 아닌 경우에는 전달한 size 그대로 반환합니다.', function() {
            var actual;

            spyOn(renderUtil, 'isOldBrowser').and.returnValue(false);

            actual = axis._makeTopPosition(100);

            expect(actual).toBe(100);
        });

        it('rotateTitle옵션도 없고 오른쪽 y축도 아니며 구형브라우저(IE8이하)인 경우에는 null을 반환합니다.', function() {
            var actual;

            spyOn(renderUtil, 'isOldBrowser').and.returnValue(true);

            actual = axis._makeTopPosition();

            expect(actual).toBeNull();
        });
    });

    describe('_makePositionMapForNotCenterAlign()', function() {
        it('y축이 중앙 정렬이 아닌 경우의 position(top, left) map을 구합니다.', function() {
            var actual;

            spyOn(axis, '_makeTopPosition').and.returnValue(50);

            actual = axis._makePositionMapForNotCenterAlign();

            expect(actual.left).toBe(0);
            expect(actual.top).toBe(50);
        });

        it('오른쪽 y축인 경우에는 left가 아닌 right값을 반환합니다.', function() {
            var actual;

            spyOn(axis, '_makeTopPosition').and.returnValue(50);
            spyOn(axis, '_makeRightPosition').and.returnValue(30);
            axis.data.isPositionRight = true;

            actual = axis._makePositionMapForNotCenterAlign();

            expect(actual.right).toBe(30);
            expect(actual.left).toBeUndefined();
            expect(actual.top).toBe(50);
        });

        it('top position값이 null인 경우에는 top을 반환하지 않습니다. ', function() {
            var actual;

            spyOn(axis, '_makeTopPosition').and.returnValue(null);

            actual = axis._makePositionMapForNotCenterAlign();

            expect(actual.left).toBe(0);
            expect(actual.top).toBeUndefined();
        });
    });

    describe('_renderTitleAreaStyle()', function() {
        it('타이틀 너비가 50인 좌측 y axis 타이틀 영역의 css style을 렌더링 합니다.', function() {
            var elTitle = dom.create('DIV');

            spyOn(renderUtil, 'isOldBrowser').and.returnValue(false);

            axis._renderTitleAreaStyle(elTitle, 50);

            expect(elTitle.style.width).toBe('50px');
            expect(elTitle.style.left).toBe('0px');
            expect(elTitle.style.top).toBe('50px');
        });

        it('IE8이하의 구형 브라우저에서는 top값을 설정하지 않습니다.', function() {
            var elTitle = dom.create('DIV');

            spyOn(renderUtil, 'isOldBrowser').and.returnValue(true);

            axis._renderTitleAreaStyle(elTitle, 50);

            expect(elTitle.style.width).toBe('50px');
            expect(elTitle.style.left).toBe('0px');
            expect(elTitle.style.top).toBe('');
        });

        it('rotateTitle옵션이 false인 경우에는 top값을 제목 높이와 yAxis높이로 계산합니다. ', function() {
            var elTitle = dom.create('DIV');

            axis.options.rotateTitle = false;

            axis._renderTitleAreaStyle(elTitle, 200);

            expect(elTitle.style.top).toBe('90px');
        });

        it('우측 y axis 타이틀 영역의 css style을 렌더링합니다. 우측에 배치되기 때문에 right값으로 설정됩니다.', function() {
            var elTitle = dom.create('DIV');

            axis.data.isPositionRight = true;
            spyOn(renderUtil, 'isIE7').and.returnValue(false);
            axis._renderTitleAreaStyle(elTitle, 50);

            expect(elTitle.style.width).toBe('50px');
            expect(elTitle.style.right).toBe('-50px');
            expect(elTitle.style.top).toBe('0px');
        });

        it('우측 y axis 타이틀 이면서 IE7의 경우는 right를 0으로 설정합니다.', function() {
            var elTitle = dom.create('DIV');

            axis.data.isPositionRight = true;
            spyOn(renderUtil, 'isIE7').and.returnValue(true);
            axis._renderTitleAreaStyle(elTitle, 50);

            expect(elTitle.style.right).toBe('0px');
        });

        it('우측 y axis 타이틀 이면서 rotateTitle옵션이 false인 경우도 right를 0으로 설정합니다.', function() {
            var elTitle = dom.create('DIV');

            axis.data.isPositionRight = true;
            spyOn(renderUtil, 'isIE7').and.returnValue(false);
            axis.options.rotateTitle = false;
            axis._renderTitleAreaStyle(elTitle, 50);

            expect(elTitle.style.right).toBe('0px');
        });

        it('isCenter 옵션으로 인해 중앙에 배치될 경우의 css style을 랜더링 합니다.', function() {
            var elTitle = dom.create('DIV');

            boundsMaker.getDimension.and.callFake(function(type) {
                if (type === 'yAxis') {
                    return {
                        width: 80
                    };
                } else if (type === 'xAxis') {
                    return {
                        height: 30
                    };
                }
            });
            axis.options.title = 'Title';
            axis.options.isCenter = true;
            axis._renderTitleAreaStyle(elTitle);

            expect(elTitle.style.left).toBe('15px');
            expect(elTitle.style.bottom).toBe('-30px');
        });
    });

    describe('_renderTitleArea()', function() {
        it('타이틀이 있을 경우에는 타이틀 영역이 설정값 대로 정상 렌더링됩니다.', function() {
            var elTitle;

            axis.options.title = 'Axis Title';
            axis.theme.fontSize = 12;
            axis.data.isVertical = true;
            elTitle = axis._renderTitleArea(200);

            expect(elTitle.innerHTML).toBe('Axis Title');
            expect(elTitle.style.width).toBe('200px');
        });
        it('타이틀이 없을 경우에는 타이틀 영역이 렌더링 되지 않고 null을 반환합니다.', function() {
            var elTitle;

            axis.options.title = '';
            axis.theme.fontSize = 12;
            axis.data.isVertical = true;
            elTitle = axis._renderTitleArea(200);

            expect(elTitle).toBeNull();
        });
    });

    describe('_makeTickLineHtml()', function() {
        it('세로 axis의 tick line의 html을 생성합니다.', function() {
            var actual, expected;

            axis.data.isVertical = true;

            actual = axis._makeTickLineHtml(100, 'top', true, 0);
            expected = '<div class="tui-chart-tick-line" style="top:-1px;height:101px"></div>';

            expect(actual).toBe(expected);
        });

        it('가로 axis의 tick line의 html을 생성합니다.', function() {
            var actual, expected;

            axis.data.isVertical = false;

            actual = axis._makeTickLineHtml(100, 'left', true, 0);
            expected = '<div class="tui-chart-tick-line" style="left:-1px;width:101px"></div>';

            expect(actual).toBe(expected);
        });

        it('axis tick을 자동으로 보정할 경우(positionRatio, lineWidth 존재) 있을 경우의 가로 tick line html을 생성합니다.', function() {
            var actual, expected;

            axis.data.isVertical = false;
            axis.data.positionRatio = 0.2;
            axis.data.lineWidth = 100;

            actual = axis._makeTickLineHtml(100, 'left', true, 20);
            expected = '<div class="tui-chart-tick-line" style="left:-1px;width:100px"></div>';

            expect(actual).toBe(expected);
        });

        it('axis tick을 자동으로 보정할 경우(positionRatio, lineWidth 존재) 있을 경우의 가로 tick line html을 생성합니다.', function() {
            var actual, expected;

            axis.data.isVertical = false;
            axis.data.positionRatio = 0.2;
            axis.data.lineWidth = 100;

            actual = axis._makeTickLineHtml(100, 'left', true, 20);
            expected = '<div class="tui-chart-tick-line" style="left:-1px;width:100px"></div>';

            expect(actual).toBe(expected);
        });
    });

    describe('_makeTickHtml()', function() {
        it('tick html을 생성합니다.', function() {
            var actual = axis._makeTickHtml(100, 5, 'left', true, 0);
            var expected = '<div class="tui-chart-tick" style="background-color:black;left: -1px"></div>' +
                '<div class="tui-chart-tick" style="background-color:black;left: 25px"></div>' +
                '<div class="tui-chart-tick" style="background-color:black;left: 50px"></div>' +
                '<div class="tui-chart-tick" style="background-color:black;left: 74px"></div>' +
                '<div class="tui-chart-tick" style="background-color:black;left: 99px"></div>';

            expect(actual).toBe(expected);
        });
    });

    describe('_renderTickArea()', function() {
        it('axis 영역의 너비가 300이고 tick count가 5인 x축(레이블 타입) tick 영역에는 5개의 tick이 75px(or 74px) 간격으로 좌측에서 부터 렌더링 됩니다.', function() {
            var size = 300,
                tickCount = 5,
                categories = [],
                elTickArea, childNodes;

            axis.data.isVertical = false;

            elTickArea = axis._renderTickArea(size, tickCount, categories);
            childNodes = elTickArea.childNodes;

            expect(childNodes.length).toBe(6);
            expect(childNodes[0].className).toBe('tui-chart-tick-line');
            expect(childNodes[1].style.left).toBe('-1px');
            expect(childNodes[2].style.left).toBe('75px');
            expect(childNodes[3].style.left).toBe('150px');
            expect(childNodes[4].style.left).toBe('224px');
            expect(childNodes[5].style.left).toBe('299px');
        });

        it('axis 영역의 높이가 300이고 tick count가 5인 y축(벨류 타입) tick 영역에는 5개의 tick이 75px(or 74px) 간격으로 밑에서 부터 렌더링 됩니다.', function() {
            var size = 300,
                tickCount = 5,
                categories = [],
                elTickArea, childNodes;

            axis.data.isLabelAxis = false;
            axis.data.isVertical = true;

            elTickArea = axis._renderTickArea(size, tickCount, categories);
            childNodes = elTickArea.childNodes;

            expect(childNodes.length).toBe(6);
            expect(childNodes[0].className).toBe('tui-chart-tick-line');
            expect(childNodes[1].style.bottom).toBe('0px');
            expect(childNodes[2].style.bottom).toBe('75px');
            expect(childNodes[3].style.bottom).toBe('150px');
            expect(childNodes[4].style.bottom).toBe('224px');
            expect(childNodes[5].style.bottom).toBe('299px');
        });
    });

    describe('_makeVerticalLabelCssText()', function() {
        it('세로 axis의 cssText를 생성합니다.', function() {
            var actual = axis._makeVerticalLabelCssText(50, 20),
                expected = ';width:40px';
            expect(actual).toBe(expected);
        });
    });

    describe('_applyLabelAreaStyle()', function() {
        it('label container에 fontSize, fontFamily, color등의 css style 속성을 추가합니다.', function() {
            var labelContainer = dom.create('DIV');

            axis.theme.label = {
                fontSize: 12,
                fontFamily: 'Verdana',
                color: 'red'
            };
            axis._applyLabelAreaStyle(labelContainer);

            expect(labelContainer.style.fontSize).toBe('12px');
            expect(labelContainer.style.fontFamily).toBe('Verdana');
            expect(labelContainer.style.color).toBe('red');
        });

        it('세로차트(isVertical=true)인 경우에는 너비값(width)도 설정합니다.', function() {
            var labelContainer = dom.create('DIV');

            axis.data.isVertical = true;
            axis._applyLabelAreaStyle(labelContainer, 50);

            expect(labelContainer.style.width).toBe('20px');
        });
    });

    describe('_renderLabelArea()', function() {
        it('axis 영역의 너비가 300인 레이블 타입 x축 레이블 영역은 너비 100px과 간격 100px(or 99px)로 레이블값을 포함하여 렌더링 됩니다.', function() {
            var size = 300,
                axisWidth = 0,
                tickCount = 4,
                categories = ['label1', 'label2', 'label3'],
                elLabelArea, childNodes;

            axis.data.isLabelAxis = true;
            axis.data.isVertical = false;

            elLabelArea = axis._renderLabelArea(size, axisWidth, tickCount, categories);
            childNodes = elLabelArea.childNodes;

            expect(childNodes.length).toBe(3);
            expect(childNodes[0].style.left).toBe('0px');
            expect(childNodes[1].style.left).toBe('100px');
            expect(childNodes[2].style.left).toBe('199px');
            expect(childNodes[0].style.width).toBe('100px');
            expect(childNodes[1].style.width).toBe('100px');
            expect(childNodes[2].style.width).toBe('100px');
            expect(childNodes[0].innerHTML.toLowerCase()).toBe('<span>label1</span>');
            expect(childNodes[1].innerHTML.toLowerCase()).toBe('<span>label2</span>');
            expect(childNodes[2].innerHTML.toLowerCase()).toBe('<span>label3</span>');
        });

        it('axis 영역의 높이가 300인 레이블 타입 y축 레이블 영역은 높이 100px과 간격 100px(or 99px)로 레이블값을 포함하여 렌더링 됩니다.', function() {
            var size = 300,
                axisWidth = 100,
                tickCount = 4,
                categories = ['label1', 'label2', 'label3'],
                elLabelArea, childNodes;

            axis.data.isLabelAxis = true;
            axis.data.isVertical = true;

            elLabelArea = axis._renderLabelArea(size, axisWidth, tickCount, categories);
            childNodes = elLabelArea.childNodes;

            expect(childNodes.length).toBe(3);
            expect(childNodes[0].style.top).toBe('0px');
            expect(childNodes[1].style.top).toBe('100px');
            expect(childNodes[2].style.top).toBe('199px');
            expect(childNodes[0].style.height).toBe('100px');
            expect(childNodes[1].style.height).toBe('100px');
            expect(childNodes[2].style.height).toBe('100px');
            expect(childNodes[0].style.lineHeight).toBe('100px');
            expect(childNodes[1].style.lineHeight).toBe('100px');
            expect(childNodes[2].style.lineHeight).toBe('100px');
            expect(childNodes[0].innerHTML.toLowerCase()).toBe('<span>label1</span>');
            expect(childNodes[1].innerHTML.toLowerCase()).toBe('<span>label2</span>');
            expect(childNodes[2].innerHTML.toLowerCase()).toBe('<span>label3</span>');
        });

        it('axis 영역의 너비가 300인 벨류 타입 x축 레이블 영역은 너비 150px과 간격 150px(or 149px)로 벨류형태의 레이블 값을 포함하여 렌더링 됩니다.', function() {
            var size = 300,
                axisWidth = 0,
                tickCount = 3,
                categories = ['0.00', '30.00', '60.00'],
                elLabelArea, childNodes;

            elLabelArea = axis._renderLabelArea(size, axisWidth, tickCount, categories);
            childNodes = elLabelArea.childNodes;

            expect(childNodes.length).toBe(3);

            // 벨류 타입의 경우는 tick 옆에 배치되기 때문에 레이블 타입과는 다른 간격으로 놓이게 됩니다.
            expect(childNodes[0].style.left).toBe('0px');
            expect(childNodes[1].style.left).toBe('150px');
            expect(childNodes[2].style.left).toBe('299px');
            expect(childNodes[0].style.width).toBe('150px');
            expect(childNodes[1].style.width).toBe('150px');
            expect(childNodes[2].style.width).toBe('150px');
            expect(childNodes[0].innerHTML.toLowerCase()).toBe('<span>0.00</span>');
            expect(childNodes[1].innerHTML.toLowerCase()).toBe('<span>30.00</span>');
            expect(childNodes[2].innerHTML.toLowerCase()).toBe('<span>60.00</span>');
        });

        it('axis 영역의 높이가 300인 벨류 타입 y축 레이블 영역은 150px(or 149px)의 간격으로 벨류형태의 레이블 값을 포함하여 렌더링 됩니다.', function() {
            var size = 300,
                axisWidth = 100,
                tickCount = 3,
                categories = ['0.00', '30.00', '60.00'],
                elLabelArea, childNodes;

            axis.data.isVertical = true;

            elLabelArea = axis._renderLabelArea(size, axisWidth, tickCount, categories);
            childNodes = elLabelArea.childNodes;

            expect(childNodes.length).toBe(3);
            expect(childNodes[0].style.bottom).toBe('0px');
            expect(childNodes[1].style.bottom).toBe('150px');
            expect(childNodes[2].style.bottom).toBe('299px');
            expect(childNodes[0].innerHTML.toLowerCase()).toBe('<span>0.00</span>');
            expect(childNodes[1].innerHTML.toLowerCase()).toBe('<span>30.00</span>');
            expect(childNodes[2].innerHTML.toLowerCase()).toBe('<span>60.00</span>');
        });
    });

    describe('_getRenderedTitleHeight()', function() {
        it('렌더링된 타이틀 높이를 반환합니다.', function() {
            var result = axis._getRenderedTitleHeight();
            expect(result).toBe(20);
        });
    });

    describe('_makeLabelCssText()', function() {
        //여기부터 검토
        it('레이블 높이가 100인 레이블 타입 y축의 cssText를 생성합니다.', function() {
            var actual, expected;;

            axis.data.isVertical = true;
            axis.data.isLabelAxis = true;
            actual = axis._makeLabelCssText(100);
            expected = 'height:100px;line-height:100px;';

            expect(actual).toBe(expected);
        });

        it('레이블 너비가 100인 타입 x축의 cssText를 생성합니다.', function() {
            var actual, expected;;

            axis.data.isVertical = false;
            axis.data.isLabelAxis = true;
            actual = axis._makeLabelCssText(100);
            expected = 'width:100px;';

            expect(actual).toBe(expected);
        });

        it('벨류 타입 y축의 경우는 빈 cssText가 생성됩니다.', function() {
            var actual, expected;;

            axis.data.isVertical = true;
            axis.data.isLabelAxis = false;
            actual = axis._makeLabelCssText();
            expected = '';

            expect(actual).toBe(expected);
        });

        it('너비가 100인 벨류 타입 x축의 cssText를 생성합니다.', function() {
            var actual, expected;;

            axis.data.isVertical = false;
            axis.data.isLabelAxis = false;
            actual = axis._makeLabelCssText(100);
            expected = 'width:100px;';

            expect(actual).toBe(expected);
        });
    });

    describe('_calculateRotationMovingPosition()', function() {
        it('xAxis label 회전 시 위치해야 할 position을 계산합니다.', function() {
            var actual, expected;

            axis.boundsMaker.xAxisDegree = 25;
            actual = axis._calculateRotationMovingPosition({
                left: 40,
                moveLeft: 20,
                top: 30
            });
            expected = {
                top: 30,
                left: 20
            };
            expect(actual).toEqual(expected);
        });

        it('85도 각도에서는 레이블이 가운데 위치하도록 left를 조절합니다.', function() {
            var actual, expected;

            axis.boundsMaker.xAxisDegree = 85;
            actual = axis._calculateRotationMovingPosition({
                labelHeight: 20,
                left: 40,
                moveLeft: 20,
                top: 30
            });
            expected = {
                top: 30,
                left: 10.038053019082547
            };

            expect(actual).toEqual(expected);
        });
    });

    describe('_calculateRotationMovingPositionForOldBrowser()', function() {
        it('IE7이 아닌 경우의 25도 회전된 position정보를 계산하여 반환합니다.', function() {
            var actual, expected;

            spyOn(renderUtil, 'isIE7').and.returnValue(false);
            axis.boundsMaker.xAxisDegree = 25;
            actual = axis._calculateRotationMovingPositionForOldBrowser({
                labelWidth: 40,
                labelHeight: 20,
                left: 40,
                label: 'label1',
                theme: {}
            });
            expected = {
                top: 10,
                left: 24.684610648167506
            };
            expect(actual).toEqual(expected);
        });

        it('85도 각도에서는 레이블이 가운데 위치하도록 left를 조절합니다.', function() {
            var actual, expected;

            spyOn(renderUtil, 'isIE7').and.returnValue(false);
            axis.boundsMaker.xAxisDegree = 85;
            actual = axis._calculateRotationMovingPositionForOldBrowser({
                degree: 85,
                labelWidth: 20,
                labelHeight: 20,
                left: 40,
                label: 'label1',
                theme: {}
            });
            expected = {
                top: 10,
                left: 65.68026588169964
            };
            expect(actual).toEqual(expected);
        });

        it('IE7인 경우에는 changedWidth 값을 더하지 않습니다.', function() {
            var actual, expected;

            spyOn(renderUtil, 'isIE7').and.returnValue(true);
            axis.boundsMaker.xAxisDegree = 25;
            actual = axis._calculateRotationMovingPositionForOldBrowser({
                labelWidth: 40,
                labelHeight: 20,
                left: 40,
                label: 'label1',
                theme: {}
            });
            expected = {
                top: 10,
                left: 28.45236523481399
            };
            expect(actual).toEqual(expected);
        });
    });

    describe('_makeCssTextForRotationMoving()', function() {
        it('_calculateRotationMovingPosition() 결과로 얻은 position 정보로 cssText를 생성합니다.', function() {
            var actual, expected;
            spyOn(renderUtil, 'isOldBrowser').and.returnValue(false);
            spyOn(axis, '_calculateRotationMovingPosition').and.returnValue({left: 10, top: 10});
            actual = axis._makeCssTextForRotationMoving();
            expected = 'left:10px;top:10px';
            expect(actual).toEqual(expected);
        });

        it('old browser의 경우는 _calculateRotationMovingPositionForOldBrowser() 결과로 얻은 position 정보로 cssText를 생성합니다.', function() {
            var actual, expected;
            spyOn(renderUtil, 'isOldBrowser').and.returnValue(true);
            spyOn(axis, '_calculateRotationMovingPositionForOldBrowser').and.returnValue({left: 10, top: 10});
            actual = axis._makeCssTextForRotationMoving();
            expected = 'left:10px;top:10px';
            expect(actual).toEqual(expected);
        });
    });

    describe('_makeNormalLabelsHtml()', function() {
        it('간격이 50px인 회전없는 레이블 영역 html을 생성합니다.', function() {
            var positions = [30, 80, 130],
                categories = ['label1', 'label2', 'label3'],
                labelSize = 50,
                actual, expected;

            actual = axis._makeNormalLabelsHtml(positions, categories, labelSize);
            expected = '<div class="tui-chart-label" style="width:50px;left:30px"><span>label1</span></div>' +
                '<div class="tui-chart-label" style="width:50px;left:80px"><span>label2</span></div>' +
                '<div class="tui-chart-label" style="width:50px;left:130px"><span>label3</span></div>';

            expect(actual).toBe(expected);
        });
    });

    describe('_makeRotationLabelsHtml()', function() {
        it('45도로 회전된 레이블 영역 html을 생성합니다.', function() {
            var positions = [30, 80, 130],
                categories = ['label1', 'label2', 'label3'],
                labelSize = 80,
                actual, expected;

            spyOn(axis, '_makeCssTextForRotationMoving').and.returnValue('left:10px;top:10px');
            spyOn(renderUtil, 'isIE7').and.returnValue(false);
            boundsMaker.xAxisDegree = 45;
            actual = axis._makeRotationLabelsHtml(positions, categories, labelSize);
            expected = '<div class="tui-chart-label tui-chart-xaxis-rotation tui-chart-xaxis-rotation45" style="width:80px;left:10px;top:10px"><span>label1</span></div>' +
                '<div class="tui-chart-label tui-chart-xaxis-rotation tui-chart-xaxis-rotation45" style="width:80px;left:10px;top:10px"><span>label2</span></div>' +
                '<div class="tui-chart-label tui-chart-xaxis-rotation tui-chart-xaxis-rotation45" style="width:80px;left:10px;top:10px"><span>label3</span></div>';

            expect(actual).toBe(expected);
        });

        it('IE7일 경우의 45도로 회전된 레이블 영역 html을 생성합니다.', function() {
            var positions = [30],
                categories = ['label1'],
                labelSize = 80,
                actual, expected;

            spyOn(axis, '_makeCssTextForRotationMoving').and.returnValue('left:10px;top:10px');
            spyOn(renderUtil, 'isIE7').and.returnValue(true);
            boundsMaker.xAxisDegree = 45;
            actual = axis._makeRotationLabelsHtml(positions, categories, labelSize);
            expected = '<div class="tui-chart-label tui-chart-xaxis-rotation tui-chart-xaxis-rotation45" style="width:80px;left:10px;top:10px">' +
                    '<span style="filter: progid:DXImageTransform.Microsoft.Matrix(SizingMethod=\'auto expand\',' +
                    ' M11=0.7071067811865476, M12=0.7071067811865475, M21=-0.7071067811865475, M22=0.7071067811865476)">label1</span>' +
                '</div>';

            expect(actual).toBe(expected);
        });
    });

    describe('_makeLabelsHtml()', function() {
        it('degree 정보가 없을 경우에는 _makeNormalLabelsHtml()을 실행합니다.', function() {
            var positions = [30, 80, 130],
                categories = ['label1', 'label2', 'label3'],
                labelSize = 50,
                actual, expected;

            actual = axis._makeLabelsHtml(positions, categories, labelSize);
            expected = axis._makeNormalLabelsHtml(positions, categories, labelSize);

            expect(actual).toBe(expected);
        });

        it('degree 정보가 있을 경우에는 _makeRotationLabelsHtml()을 실행합니다.', function() {
            var positions = [30, 80, 130],
                categories = ['label1', 'label2', 'label3'],
                labelSize = 50,
                actual, expected;

            spyOn(renderUtil, 'isOldBrowser').and.returnValue(false);
            boundsMaker.xAxisDegree = 45;
            axis.componentName = 'xAxis';
            actual = axis._makeLabelsHtml(positions, categories, labelSize);
            expected = axis._makeRotationLabelsHtml(positions, categories, labelSize);

            expect(actual).toBe(expected);
        });

        it('가로차트의 라벨 타입 axis의 roation 옵션이 false이면 dataProcessor.getMultilineCategories() 를 호출하여 categories를 덮어씌웁니다.', function() {
            axis.data = {
                isVertical: false,
                isLabelAxis: true
            };
            axis.options.rotateLabel = false;
            dataProcessor.getMultilineCategories.and.returnValue([]);
            spyOn(axis, '_makeRotationLabelsHtml');
            spyOn(axis, '_makeNormalLabelsHtml');

            axis._makeLabelsHtml([]);

            expect(dataProcessor.getMultilineCategories).toHaveBeenCalled();
        });
    });

    describe('_changeLabelAreaPosition()', function() {
        it('레이블 타입 축(x,y 모두 포함)의 경우에는 레이블 영역 위치 이동은 없습니다.', function() {
            var labelContainer = dom.create('DIV');

            axis.data.isLabelAxis = true;
            axis._changeLabelAreaPosition(labelContainer);

            // 레이블이 타입의 경우 기본 설정이 가운데 배치되기 때문에 위치 이동 필요 없습니다.
            expect(labelContainer.style.top).toBe('');
            expect(labelContainer.style.left).toBe('');
        });

        it('벨류 타입 y축의 경우는 레이블을 tick의 중앙에 위치 시키기 위해 영역이 top 10px 이동 됩니다.', function() {
            var labelContainer = dom.create('DIV'),
                actual, expected;

            axis.data.isVertical = true;
            axis._changeLabelAreaPosition(labelContainer);

            actual = labelContainer.style.top;
            expected = '10px';

            expect(actual).toBe(expected);
        });

        it('벨류 타입 x축의 경우는 레이블을 tick의 중앙에 위치 시키기 위해 영역이 left -25px 이동 됩니다.', function() {
            var labelContainer = dom.create('DIV'),
                actual, expected;

            axis._changeLabelAreaPosition(labelContainer, 50);

            actual = labelContainer.style.left;
            expected = '-25px';

            expect(actual).toBe(expected);
        });
    });

    describe('_renderChildContainers()', function() {
        it('axis의 제목, 레이블, 틱 영역을 렌더링 합니다.', function() {
            var size = 300,
                axisWidth = 300,
                tickCount = 4,
                categories = ['label1', 'label2', 'label3'],
                actual = axis._renderChildContainers(size, axisWidth, tickCount, categories);

            expect(actual.length).toBe(4);
            expect(actual[0].className).toBe('tui-chart-title-area rotation');
            expect(actual[1].className).toBe('tui-chart-label-area');
            expect(actual[2].className).toBe('tui-chart-tick-area');
            // isCenter가 true인 경우(yAxis 중앙정렬)에만 tick area가 추가됨
            expect(actual[4]).toBeUndefined();
        });

        it('line type(isVertical=true, aligned=true)의 경우 틱 영역은 제외합니다.', function() {
            var size = 300,
                axisWidth = 300,
                tickCount = 4,
                categories = ['label1', 'label2', 'label3'],
                actual;

            axis.data.isVertical = true;
            axis.data.aligned = true;

            actual = axis._renderChildContainers(size, axisWidth, tickCount, categories);

            expect(actual.length).toBe(2);
            expect(actual[0].className).toBe('tui-chart-title-area rotation');
            expect(actual[1].className).toBe('tui-chart-label-area');
        });
    });

    describe('_renderDivisionAxisArea()', function() {
        it('분할 axis영역을 렌더링 합니다.', function() {
            var container = dom.create('DIV');

            axis.data = {
                labels: ['label1', 'label2', 'label3'],
                tickCount: 4
            };

            boundsMaker.getDimension.and.returnValue({
                width: 50
            });

            axis._renderDivisionAxisArea(container, 300);

            expect(container.childNodes[0].className).toBe('tui-chart-title-area rotation');
            expect(container.childNodes[1].className).toBe('tui-chart-label-area');
            expect(container.childNodes[2].className).toBe('tui-chart-tick-area');
            expect(container.childNodes[2].firstChild.className).toBe('tui-chart-tick-line');
            expect(container.childNodes[2].firstChild.style.width).toBe('151px');
            expect(container.childNodes[3].className).toBe('tui-chart-title-area rotation right');
            expect(container.childNodes[4].className).toBe('tui-chart-label-area');
            expect(container.childNodes[5].className).toBe('tui-chart-tick-area');
        });
    });

    describe('_renderSingleAxisArea()', function() {
        it('단독 axis영역을 렌더링 합니다.', function() {
            var container = dom.create('DIV');

            axis.data = {
                labels: ['label1', 'label2', 'label3'],
                tickCount: 4
            };

            axis._renderSingleAxisArea(container, {
                width: 300,
                height: 50
            });

            expect(container.childNodes[0].className).toBe('tui-chart-title-area rotation');
            expect(container.childNodes[1].className).toBe('tui-chart-label-area');
            expect(container.childNodes[2].className).toBe('tui-chart-tick-area');
            expect(container.childNodes[2].firstChild.className).toBe('tui-chart-tick-line');
            expect(container.childNodes[2].firstChild.style.width).toBe('301px');
        });
    });

    describe('_renderAxisArea()', function() {
        it('axis의 전체 영역을 렌더링하면 className을 설정하고 dimension과 position을 설정합니다.', function() {
            var container = dom.create('DIV');

            boundsMaker.getDimension.and.returnValue({
                width: 300,
                height: 50
            });
            boundsMaker.getPosition.and.returnValue({
                top: 20
            });
            axis.data = {
                labels: ['label1', 'label2', 'label3'],
                tickCount: 4
            };

            axis._renderAxisArea(container);

            expect(container.style.width).toBe('300px');
            expect(container.style.height).toBe('50px');
            expect(container.style.top).toBe('20px');
            expect(dom.hasClass(container, 'horizontal')).toBe(true);
        });

        it('divided이 true이면 _renderDivisionAxisArea()를 수행하고 너비를 yAxis 너비만큼 늘려줍니다.', function() {
            var container = dom.create('DIV');


            spyOn(axis, '_renderSingleAxisArea');
            spyOn(axis, '_renderDivisionAxisArea');
            boundsMaker.getDimension.and.callFake(function(type) {
                if (type === 'yAxis') {
                    return {
                        width: 80
                    };
                } else if (type === 'xAxis') {
                    return {
                        width: 300,
                        height: 50
                    };
                }
            });

            boundsMaker.getPosition.and.returnValue({
                top: 20
            });

            axis.componentName = 'xAxis';
            axis.options.divided = true;
            axis.data = {
                labels: ['label1', 'label2', 'label3'],
                tickCount: 4
            };

            axis._renderAxisArea(container);

            expect(container.style.width).toBe('380px');
            expect(axis._renderSingleAxisArea).not.toHaveBeenCalled();
            expect(axis._renderDivisionAxisArea).toHaveBeenCalled();
        });

        it('divided이 true가 아니면 _renderSingleAxisArea()를 수행합니다.', function() {
            var container = dom.create('DIV');


            spyOn(axis, '_renderSingleAxisArea');
            spyOn(axis, '_renderDivisionAxisArea');
            boundsMaker.getDimension.and.callFake(function(type) {
                if (type === 'yAxis') {
                    return {
                        width: 80
                    };
                } else if (type === 'xAxis') {
                    return {
                        width: 300,
                        height: 50
                    };
                }
            });

            boundsMaker.getPosition.and.returnValue({
                top: 20
            });

            axis.componentName = 'xAxis';
            axis.data = {
                labels: ['label1', 'label2', 'label3'],
                tickCount: 4
            };

            axis._renderAxisArea(container);

            expect(container.style.width).toBe('300px');
            expect(axis._renderSingleAxisArea).toHaveBeenCalled();
            expect(axis._renderDivisionAxisArea).not.toHaveBeenCalled();
        });
    });

    describe('rerender()', function() {
        it('_isInvalidRightYAxis()가 false이면 container의 내용만 비우고 끝냅니다.', function() {
            axis.axisContainer = dom.create('DIV');
            axis.axisContainer.innerHTML = 'contents';

            spyOn(axis, '_isValidAxis').and.returnValues(false);

            axis.rerender();

            expect(axis.axisContainer.innerHTML).toBe('');
        });

        it('_isInvalidRightYAxis()가 false이서 this.options가 있을 경우 options의 내용을 갱신하면서 _renderAxisArea()를 수행합니다.', function() {
            var options = {
                    title: 'ABC'
                };

            spyOn(axis, '_renderAxisArea');

            axis.axisContainer = dom.create('DIV');
            axis.options = {};
            axis.rerender({
                options: options
            });

            expect(axis.options).toEqual(options);
            expect(axis._renderAxisArea).toHaveBeenCalled();
        });
    });
});
