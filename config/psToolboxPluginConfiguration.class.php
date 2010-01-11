<?php
/*
 * This file is part of the psToolboxPlugin package.
 * (c) 2010 Thomas Rabaix <thomas.rabaix@soleoweb.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 *
 *
 * @package    psToolboxPlugin
 * @author     Thomas Rabaix <thomas.rabaix@soleoweb.com>
 * @version    SVN: $Id$
 */
class psToolboxPluginConfiguration extends sfPluginConfiguration
{

  public function initialize()
  {
    if($this->configuration instanceof sfApplicationConfiguration)
    {
      include($this->configuration->getConfigCache()->checkConfig(sfConfig::get('sf_config_dir').'/psToolboxPlugin.yml'));
    }
  }

}