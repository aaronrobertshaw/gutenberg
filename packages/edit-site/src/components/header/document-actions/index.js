/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, Dropdown } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export default function DocumentActions( {
	templateId,
	secondaryItem = 'Header',
	isSecondaryItemActive = false,
} ) {
	// TODO: I dislike having this here...
	const template = useSelect(
		( select ) => {
			const { getEntityRecord } = select( 'core' );

			return getEntityRecord( 'postType', 'wp_template', templateId );
		},
		[ templateId ]
	);

	return (
		<div className="edit-site-document-actions">
			{ template ? (
				<Dropdown
					position="bottom center"
					renderToggle={ ( { onToggle, isOpen } ) => {
						return (
							<Button
								onClick={ onToggle }
								className="edit-site-document-actions__document_root"
								aria-haspopup="true"
								aria-expanded={ isOpen }
							>
								<span> { template.slug } </span>
								{ secondaryItem && (
									<>
										<span className="edit-site-document-actions__separator">
											:{ ' ' }
										</span>
										<span
											className={ classnames(
												'edit-site-document-actions__document_item',
												{
													'is-active':
														isSecondaryItemActive ||
														isOpen,
												}
											) }
										>
											{ secondaryItem }
										</span>
									</>
								) }
							</Button>
						);
					} }
					renderContent={ () => <div>TODO: Document Settings</div> }
				/>
			) : (
				__( 'Loading…' )
			) }
		</div>
	);
}
