/**
 * External dependencies
 */
import { find, get, upperFirst } from 'lodash';
import classnames from 'classnames';
/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import {
	InnerBlocks,
	InspectorControls,
	BlockControls,
	__experimentalUseColors,
	__experimentalUseBlockWrapperProps as useBlockWrapperProps,
	__experimentalUseEditorFeature as useEditorFeature,
} from '@wordpress/block-editor';
import { useDispatch, withSelect, withDispatch } from '@wordpress/data';
import { PanelBody, ToggleControl, ToolbarGroup } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useBlockNavigator from './use-block-navigator';
import BlockColorsStyleSelector from './block-colors-selector';
import * as navIcons from './icons';
import NavigationPlaceholder from './placeholder';

function Navigation( {
	selectedBlockHasDescendants,
	attributes,
	clientId,
	hasExistingNavItems,
	isImmediateParentOfSelectedBlock,
	isSelected,
	setAttributes,
	updateInnerBlocks,
	className,
} ) {
	//
	// HOOKS
	//
	const ref = useRef();

	const [ isPlaceholderShown, setIsPlaceholderShown ] = useState(
		! hasExistingNavItems
	);

	const { selectBlock } = useDispatch( 'core/block-editor' );

	const { TextColor, BackgroundColor, ColorPanel } = __experimentalUseColors(
		[
			{ name: 'textColor', property: 'color' },
			{ name: 'backgroundColor', className: 'has-background' },
		],
		{
			contrastCheckers: [
				{
					backgroundColor: true,
					textColor: true,
				},
			],
			colorDetector: { targetRef: ref },
			colorPanelProps: {
				initialOpen: true,
			},
		}
	);

	const { navigatorToolbarButton, navigatorModal } = useBlockNavigator(
		clientId
	);

	// Determine actual colors so user selection can be enforced.
	const {
		textColor,
		customTextColor,
		backgroundColor,
		customBackgroundColor,
	} = attributes;

	const colors = useEditorFeature( 'color.palette' );
	const getColorBySlug = ( slug, customColor ) => {
		return customColor || get( find( colors, { slug } ), 'color' ) || null;
	};

	const rgbTextColor = getColorBySlug( textColor, customTextColor );
	const rgbBackgroundColor = getColorBySlug(
		backgroundColor,
		customBackgroundColor
	);

	useEffect( () => {
		setAttributes( {
			customTextColor: rgbTextColor,
			customBackgroundColor: rgbBackgroundColor,
		} );
	}, [ rgbTextColor, rgbBackgroundColor, setAttributes ] );

	const blockProps = useBlockWrapperProps( {
		style: {
			color: customTextColor,
			backgroundColor: customBackgroundColor,
		},
	} );

	//
	// HANDLERS
	//
	function handleItemsAlignment( align ) {
		return () => {
			const itemsJustification =
				attributes.itemsJustification === align ? undefined : align;
			setAttributes( {
				itemsJustification,
			} );
		};
	}

	//
	// RENDER
	//

	if ( isPlaceholderShown ) {
		return (
			<div { ...blockProps }>
				<NavigationPlaceholder
					ref={ ref }
					onCreate={ ( blocks, selectNavigationBlock ) => {
						setIsPlaceholderShown( false );
						updateInnerBlocks( blocks );
						if ( selectNavigationBlock ) {
							selectBlock( clientId );
						}
					} }
				/>
			</div>
		);
	}

	const blockClassNames = classnames( className, {
		[ `items-justified-${ attributes.itemsJustification }` ]: attributes.itemsJustification,
		'is-vertical': attributes.orientation === 'vertical',
	} );

	return (
		<>
			<BlockControls>
				<ToolbarGroup
					icon={
						attributes.itemsJustification
							? navIcons[
									`justify${ upperFirst(
										attributes.itemsJustification
									) }Icon`
							  ]
							: navIcons.justifyLeftIcon
					}
					label={ __( 'Change items justification' ) }
					isCollapsed
					controls={ [
						{
							icon: navIcons.justifyLeftIcon,
							title: __( 'Justify items left' ),
							isActive: 'left' === attributes.itemsJustification,
							onClick: handleItemsAlignment( 'left' ),
						},
						{
							icon: navIcons.justifyCenterIcon,
							title: __( 'Justify items center' ),
							isActive:
								'center' === attributes.itemsJustification,
							onClick: handleItemsAlignment( 'center' ),
						},
						{
							icon: navIcons.justifyRightIcon,
							title: __( 'Justify items right' ),
							isActive: 'right' === attributes.itemsJustification,
							onClick: handleItemsAlignment( 'right' ),
						},
					] }
				/>
				<ToolbarGroup>{ navigatorToolbarButton }</ToolbarGroup>
				<BlockColorsStyleSelector
					TextColor={ TextColor }
					BackgroundColor={ BackgroundColor }
					rgbTextColor={ rgbTextColor }
					rgbBackgroundColor={ rgbBackgroundColor }
				>
					{ ColorPanel }
				</BlockColorsStyleSelector>
			</BlockControls>
			{ navigatorModal }
			<InspectorControls>
				<PanelBody title={ __( 'Display settings' ) }>
					<ToggleControl
						checked={ attributes.showSubmenuIcon }
						onChange={ ( value ) => {
							setAttributes( { showSubmenuIcon: value } );
						} }
						label={ __( 'Show submenu indicator icons' ) }
					/>
				</PanelBody>
			</InspectorControls>
			<TextColor>
				<BackgroundColor>
					<nav
						{ ...blockProps }
						className={ classnames(
							blockProps.className,
							blockClassNames
						) }
					>
						<InnerBlocks
							ref={ ref }
							allowedBlocks={ [
								'core/navigation-link',
								'core/search',
								'core/social-links',
							] }
							renderAppender={
								( isImmediateParentOfSelectedBlock &&
									! selectedBlockHasDescendants ) ||
								isSelected
									? InnerBlocks.DefaultAppender
									: false
							}
							templateInsertUpdatesSelection={ false }
							orientation={
								attributes.orientation || 'horizontal'
							}
							__experimentalTagName="ul"
							__experimentalAppenderTagName="li"
							__experimentalPassedProps={ {
								className: 'wp-block-navigation__container',
							} }
							__experimentalCaptureToolbars={ true }
							// Template lock set to false here so that the Nav
							// Block on the experimental menus screen does not
							// inherit templateLock={ 'all' }.
							templateLock={ false }
						/>
					</nav>
				</BackgroundColor>
			</TextColor>
		</>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const innerBlocks = select( 'core/block-editor' ).getBlocks( clientId );
		const {
			getClientIdsOfDescendants,
			hasSelectedInnerBlock,
			getSelectedBlockClientId,
		} = select( 'core/block-editor' );
		const isImmediateParentOfSelectedBlock = hasSelectedInnerBlock(
			clientId,
			false
		);
		const selectedBlockId = getSelectedBlockClientId();
		const selectedBlockHasDescendants = !! getClientIdsOfDescendants( [
			selectedBlockId,
		] )?.length;
		return {
			isImmediateParentOfSelectedBlock,
			selectedBlockHasDescendants,
			hasExistingNavItems: !! innerBlocks.length,
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		return {
			updateInnerBlocks( blocks ) {
				if ( blocks?.length === 0 ) {
					return false;
				}
				dispatch( 'core/block-editor' ).replaceInnerBlocks(
					clientId,
					blocks
				);
			},
		};
	} ),
] )( Navigation );
